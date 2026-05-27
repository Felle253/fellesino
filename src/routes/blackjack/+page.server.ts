import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/auth';
import type { RoundStatus } from '@prisma/client';

export async function load({ cookies }) {
	const user = await requireAuth(cookies);

	const userData = await prisma.user.findUnique({
		where: { id: user.id },
		select: { id: true, username: true, coins: true }
	});

	const activeRound = await prisma.gameRound.findFirst({
		where: { userId: user.id, status: 'IN_PROGRESS' },
		include: { blackjackHand: true }
	});

	return { user: userData, activeRound };
}

export const actions = {
	addBet: async ({ request, cookies }) => {
		const formData = await request.formData();
		const chipValue = parseInt(formData.get('chip') as string);
		const currentBet = parseInt(formData.get('currentBet') as string) || 0; // 👈 add this

		if (isNaN(chipValue) || chipValue <= 0) {
			return { error: 'Invalid chip value' };
		}

		const user = await requireAuth(cookies);

		const userData = await prisma.user.findUnique({
			where: { id: user.id },
			select: { coins: true }
		});
		if (!userData) throw redirect(303, '/login');

		if (currentBet + chipValue > userData.coins) { // 👈 check cumulative total
			return { error: 'You do not have enough coins to place this bet' };
		}

		return { ok: true, chipValue };
	},

	deal: async ({ request, cookies }) => {
		const formData = await request.formData();
		const betAmount = parseInt(formData.get('bet') as string);
		if (isNaN(betAmount) || betAmount <= 0) {
			return { error: 'Invalid bet amount' };
		}

		const user = await requireAuth(cookies);

		const userData = await prisma.user.findUnique({
			where: { id: user.id },
			select: { coins: true }
		});
		if (!userData) throw redirect(303, '/login');

		if (betAmount > userData.coins) {
			return { error: 'You do not have enough coins to place this bet' };
		}

		let deck = createDeck();

		const { card: p1, remainingDeck: d1 } = dealCard(deck);
		const { card: dealer1, remainingDeck: d2 } = dealCard(d1);
		const { card: p2, remainingDeck: d3 } = dealCard(d2);
		const { card: dealer2, remainingDeck: d4 } = dealCard(d3);

		const playerCards = `${p1},${p2}`;
		const dealerCards = `${dealer1},${dealer2}`;

		const round = await prisma.gameRound.create({
			data: {
				userId: user.id,
				betAmount,
				status: 'IN_PROGRESS',
				blackjackHand: {
					create: {
						playerCards,
						dealerCards,
						deck: d4.join(','),
						playerScore: calculateScore(playerCards),
						dealerScore: calculateScore(dealerCards)
					}
				}
			}
		});

		await prisma.user.update({
			where: { id: user.id },
			data: { coins: { decrement: betAmount } }
		});

		return {
			roundId: round.id,
			playerCards,
			dealerCards: dealer1,
			playerScore: calculateScore(playerCards)
		};
	},

	hit: async ({ request, cookies }) => {
		const formData = await request.formData();
		const roundId = formData.get('roundId') as string;
		const user = await requireAuth(cookies);

		const hand = await prisma.blackjackHand.findFirst({
			where: { round: { id: roundId } }
		});
		if (!hand) throw redirect(303, '/blackjack');

		const deck = hand.deck.split(',');
		const { card, remainingDeck } = dealCard(deck);
		const newCards = `${hand.playerCards},${card}`;
		const score = calculateScore(newCards);
		const bust = score > 21;

		await prisma.blackjackHand.update({
			where: { id: hand.id },
			data: { playerCards: newCards, deck: remainingDeck.join(',') }
		});

		if (bust) {
			await prisma.gameRound.update({
				where: { id: roundId },
				data: { status: 'LOST' }
			});
			return {
				playerCards: newCards,
				playerScore: score,
				bust,
				dealerCards: hand.dealerCards,
				dealerScore: calculateScore(hand.dealerCards)
			};
		}

		return { playerCards: newCards, playerScore: score, bust };
	},

	stand: async ({ request, cookies }) => {
		const formData = await request.formData();
		const roundId = formData.get('roundId') as string;
		const user = await requireAuth(cookies);

		const round = await prisma.gameRound.findUnique({
			where: { id: roundId },
			include: { blackjackHand: true }
		});
		if (!round) throw redirect(303, '/blackjack');

		const hand = round.blackjackHand;
		if (!hand) throw redirect(303, '/blackjack');

		const deck = hand.deck.split(',').filter(c => c.trim());

		const { finalCards, finalScore } = dealerPlay(hand.dealerCards, deck);
		const playerScore = calculateScore(hand.playerCards);
		const result = determineWinner(playerScore, finalScore, hand.playerCards);
		const payout = calculatePayout(round.betAmount, result);

		await prisma.gameRound.update({
			where: { id: roundId },
			data: { status: (result === 'BLACKJACK' ? 'WON' : result) as RoundStatus, payout }
		});

		if (payout > 0) {
			await prisma.user.update({
				where: { id: user.id },
				data: { coins: { increment: payout } }
			});
		}

		return { result, dealerCards: finalCards, dealerScore: finalScore, payout };
	},

	double: async ({ request, cookies }) => {
		const formData = await request.formData();
		const roundId = formData.get('roundId') as string;
		const user = await requireAuth(cookies);

		const round = await prisma.gameRound.findUnique({
			where: { id: roundId },
			include: { blackjackHand: true }
		});
		if (!round) throw redirect(303, '/blackjack');

		const hand = round.blackjackHand;
		if (!hand) throw redirect(303, '/blackjack');

		const userData = await prisma.user.findUnique({
			where: { id: user.id },
			select: { coins: true }
		});
		if (!userData) throw redirect(303, '/login');

		if (userData.coins < round.betAmount) {
			return { error: 'You don have enough coins to double down' };
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { coins: { decrement: round.betAmount } }
		});

		const newBet = round.betAmount * 2;
		await prisma.gameRound.update({
			where: { id: roundId },
			data: { betAmount: newBet }
		});

		const deck = hand.deck.split(',').filter(c => c.trim());
		const { card, remainingDeck } = dealCard(deck);
		const newPlayerCards = `${hand.playerCards},${card}`;
		const playerScore = calculateScore(newPlayerCards);

		const { finalCards, finalScore } = dealerPlay(hand.dealerCards, remainingDeck);

		const result = determineWinner(playerScore, finalScore, newPlayerCards);
		const payout = calculatePayout(newBet, result);

		await prisma.blackjackHand.update({
			where: { id: hand.id },
			data: { playerCards: newPlayerCards, dealerCards: finalCards, deck: '' }
		});

		await prisma.gameRound.update({
			where: { id: roundId },
			data: { status: (result === 'BLACKJACK' ? 'WON' : result) as RoundStatus, payout }
		});

		if (payout > 0) {
			await prisma.user.update({
				where: { id: user.id },
				data: { coins: { increment: payout } }
			});
		}
		return {
			playerCards: newPlayerCards,
			playerScore,
			dealerCards: finalCards,
			dealerScore: finalScore,
			result,
			payout
		};
	}
};

function createDeck(): string[] {
	const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	const suits = ['S', 'H', 'D', 'C']; // Spades, Hearts, Diamonds, Clubs
	const deck: string[] = [];

	for (const suit of suits) {
		for (const rank of ranks) {
			deck.push(`${rank}${suit}`);
		}
	}

	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}

	return deck;
}

function dealCard(deck: string[]): { card: string; remainingDeck: string[] } {
	const card = deck.pop();
	if (!card) throw new Error('Empty deck');
	return { card, remainingDeck: deck };
}

function calculateScore(cardsString: string): number {
	if (!cardsString) return 0;

	const cards = cardsString.split(',').map((c) => c.trim());
	let score = 0;
	let aces = 0;

	for (const card of cards) {
		const rank = card.slice(0, -1);

		if (rank === 'A') {
			aces++;
			score += 11;
		} else if (['K', 'Q', 'J'].includes(rank)) {
			score += 10;
		} else {
			score += parseInt(rank, 10);
		}
	}

	while (score > 21 && aces > 0) {
		score -= 10;
		aces--;
	}

	return score;
}

function dealerPlay(
	dealerCardsString: string,
	deck: string[]
): { finalCards: string; finalScore: number; remainingDeck: string[] } {
	let cards = dealerCardsString ? dealerCardsString.split(',').map((c) => c.trim()) : [];
	let score = calculateScore(dealerCardsString);

	while (score < 17) {
		const { card, remainingDeck } = dealCard(deck);
		cards.push(card);
		deck = remainingDeck;
		score = calculateScore(cards.join(','));
	}

	return {
		finalCards: cards.join(','),
		finalScore: score,
		remainingDeck: deck
	};
}

function determineWinner(playerScore: number, dealerScore: number, playerCardsString?: string): string {
	if (playerScore > 21) return 'LOST';

	if (playerCardsString && calculateScore(playerCardsString) === 21) {
		const cards = playerCardsString.split(',').filter(c => c.trim());
		if (cards.length === 2) return 'BLACKJACK';
	}

	if (dealerScore > 21) return 'WON';

	if (playerScore > dealerScore) return 'WON';
	if (playerScore < dealerScore) return 'LOST';

	return 'PUSH';
}

function calculatePayout(betAmount: number, result: string): number {
	switch (result) {
		case 'WON':
			return betAmount * 2;
		case 'BLACKJACK':
			return betAmount * 2.5;
		case 'PUSH':
			return betAmount;
		case 'LOST':
			return 0;
		default:
			return 0;
	}
}
