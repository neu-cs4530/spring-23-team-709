/* eslint-disable prettier/prettier */
import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import ListeningArea from './ListeningArea';

describe('ListeningArea', () => {
    const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
    let testArea: ListeningArea;
    const townEmitter = mock<TownEmitter>();
    let newPlayer: Player;
    const id = nanoid();
    const isPlaying = true;
    const song = nanoid();

    beforeEach(() => {
        mockClear(townEmitter);
        testArea = new ListeningArea({ id, isPlaying, song }, testAreaBox, townEmitter);
        newPlayer = new Player(nanoid(), mock<TownEmitter>());
        testArea.add(newPlayer);
    });

    describe('remove', () => {
        it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
            // Add another player so that we are not also testing what happens when the last player leaves
            const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
            testArea.add(extraPlayer);
            testArea.remove(newPlayer);

            expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
            const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
            expect(lastEmittedUpdate).toEqual({ id, isPlaying, song });
        });
        it("Clears the player's conversationLabel and emits an update for their location", () => {
            testArea.remove(newPlayer);
            expect(newPlayer.location.interactableID).toBeUndefined();
            const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
            expect(lastEmittedMovement.location.interactableID).toBeUndefined();
        });
        it('Clears the video property when the last occupant leaves', () => {
            testArea.remove(newPlayer);
            const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
            expect(lastEmittedUpdate).toEqual({ id, isPlaying, song: undefined });
            expect(testArea.song).toBeUndefined();
        });
    });
    describe('add', () => {
        it('Adds the player to the occupants list', () => {
            expect(testArea.occupantsByID).toEqual([newPlayer.id]);
        });
        it("Sets the player's conversationLabel and emits an update for their location", () => {
            expect(newPlayer.location.interactableID).toEqual(id);

            const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
            expect(lastEmittedMovement.location.interactableID).toEqual(id);
        });
    });
    test('toModel sets the ID, song, and isPlaying', () => {
        const model = testArea.toModel();
        expect(model).toEqual({
            id,
            song,
            isPlaying,
        });
    });
    test('updateModel sets song and isPlaying ', () => {
        testArea.updateModel({ id: 'ignore', isPlaying: false, song: 'test2' });
        expect(testArea.isPlaying).toBe(false);
        expect(testArea.id).toBe(id);
        expect(testArea.song).toBe('test2');
    });
    describe('fromMapObject', () => {
        it('Throws an error if the width or height are missing', () => {
            expect(() =>
                ListeningArea.fromMapObject(
                    { id: 1, name: nanoid(), visible: true, x: 0, y: 0 },
                    townEmitter,
                ),
            ).toThrowError();
        });
        it('Creates a new listening area using the provided boundingBox and id, with isPlaying defaulting to false, and emitter', () => {
            const x = 30;
            const y = 20;
            const width = 10;
            const height = 20;
            const name = 'name';
            const val = ListeningArea.fromMapObject(
                { x, y, width, height, name, id: 10, visible: true },
                townEmitter,
            );
            expect(val.boundingBox).toEqual({ x, y, width, height });
            expect(val.id).toEqual(name);
            expect(val.isPlaying).toEqual(false);
            expect(val.song).toBeUndefined();
            expect(val.occupantsByID).toEqual([]);
        });
    });
});
