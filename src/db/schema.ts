import { pgEnum, pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roundStatusEnum = pgEnum('round_status', ['IN_PROGRESS', 'WON', 'LOST', 'PUSH']);
export type RoundStatus = (typeof roundStatusEnum)['enumValues'][number];

export const user = pgTable('User', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email'),
	emailHash: text('emailHash').unique(),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	passwordHash: text('passwordHash'),
	passwordSalt: text('passwordSalt'),
	passwordAlgo: text('passwordAlgo'),
	passwordVersion: integer('passwordVersion').default(1),
	coins: integer('coins').default(1000).notNull(),
	lastActive: timestamp('lastActive'),
	lastClaimed: timestamp('lastClaimed')
});

export const session = pgTable('Session', {
	id: uuid('id').defaultRandom().primaryKey(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	lastUsed: timestamp('lastUsed').defaultNow().notNull(),
	expiresAt: timestamp('expiresAt').notNull(),
	userAgent: text('userAgent'),
	ipAddress: text('ipAddress'),
	deviceName: text('deviceName'),
	userId: uuid('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const gameRound = pgTable('GameRound', {
	id: uuid('id').defaultRandom().primaryKey(),
	status: roundStatusEnum('status').default('IN_PROGRESS').notNull(),
	betAmount: integer('betAmount').notNull(),
	payout: integer('payout'),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	userId: uuid('userId')
		.notNull()
		.references(() => user.id)
});

export const blackjackHand = pgTable('BlackjackHand', {
	id: uuid('id').defaultRandom().primaryKey(),
	playerCards: text('playerCards').notNull(),
	dealerCards: text('dealerCards').notNull(),
	playerScore: integer('playerScore').notNull(),
	dealerScore: integer('dealerScore').notNull(),
	deck: text('deck').notNull(),
	lastAction: text('lastAction'),
	roundId: uuid('roundId')
		.notNull()
		.unique()
		.references(() => gameRound.id, { onDelete: 'cascade' })
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	gameRounds: many(gameRound)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const gameRoundRelations = relations(gameRound, ({ one }) => ({
	user: one(user, { fields: [gameRound.userId], references: [user.id] }),
	blackjackHand: one(blackjackHand, { fields: [gameRound.id], references: [blackjackHand.roundId] })
}));

export const blackjackHandRelations = relations(blackjackHand, ({ one }) => ({
	round: one(gameRound, { fields: [blackjackHand.roundId], references: [gameRound.id] })
}));
