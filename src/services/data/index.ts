/**
 * Data Services Index
 * 
 * Central export point for all data services.
 * Automatically routes to appropriate implementation (mock vs real)
 * based on environment configuration.
 */

export {profileService, getProfileService} from './profileService';
export type {IProfileService} from './profileService';

export {friendsService, getFriendsService} from './friendsService';
export type {IFriendsService} from './friendsService';

export {gameResultsService, getGameResultsService} from './gameResultsService';
export type {IGameResultsService, GameResult} from './gameResultsService';

export {competitionService, getCompetitionService} from './competitionService';
export type {ICompetitionService, CompetitionData, FriendAvatar} from './competitionService';









