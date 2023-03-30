/* eslint-disable prettier/prettier */
import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { ListeningArea } from '../generated/client';
import TownController from './TownController';
import ListeningAreaCootroller, { ListeningAreaEvents } from './ListeningAreaController';

describe('[T2] ViewingAreaController', () => {
    // A valid ListeningAreaController to be reused within the tests
    let testArea: ListeningAreaCootroller;
    let testAreaModel: ListeningArea;
    const townController: MockProxy<TownController> = mock<TownController>();
    const mockListeners = mock<ListeningAreaEvents>();
    beforeEach(() => {
        testAreaModel = {
            id: nanoid(),
            isPlaying: true,
            song: nanoid(),
        };
        testArea = new ListeningAreaCootroller(testAreaModel);
        mockClear(townController);
        mockClear(mockListeners.playbackChange);
        mockClear(mockListeners.progressChange);
        mockClear(mockListeners.songChange);
        testArea.addListener('playbackChange', mockListeners.playbackChange);
        testArea.addListener('progressChange', mockListeners.progressChange);
        testArea.addListener('songChange', mockListeners.songChange);
    });
    describe('Setting song property', () => {
        it('updates the property and emits a songChange event if the property changes', () => {
            const newSong = nanoid();
            testArea.song = newSong;
            expect(mockListeners.songChange).toBeCalledWith(newSong);
            expect(testArea.song).toEqual(newSong);
        });
        it('does not emit a songChange event if the song property does not change', () => {
            testArea.song = `${testAreaModel.song}`;
            expect(mockListeners.songChange).not.toBeCalled();
        });
    });
    //   describe('Setting elapsedTimeSec property', () => {
    //     it('updates the model and emits a progressChange event if the property changes', () => {
    //       const newElapsedTimeSec = testArea.elapsedTimeSec + 1;
    //       testArea.elapsedTimeSec = newElapsedTimeSec;
    //       expect(mockListeners.progressChange).toBeCalledWith(newElapsedTimeSec);
    //       expect(testArea.elapsedTimeSec).toEqual(newElapsedTimeSec);
    //     });
    //     it('does not emit a progressChange event if the elapsedTimeSec property does not change', () => {
    //       testArea.elapsedTimeSec = testAreaModel.elapsedTimeSec;
    //       expect(mockListeners.progressChange).not.toBeCalled();
    //     });
    //   });
    describe('Setting isPlaying property', () => {
        it('updates the model and emits a playbackChange event if the property changes', () => {
            const newValue = !testAreaModel.isPlaying;
            testArea.isPlaying = newValue;
            expect(mockListeners.playbackChange).toBeCalledWith(newValue);
            expect(testArea.isPlaying).toEqual(newValue);
        });
        it('does not emit a playbackChange event if the isPlaying property does not change', () => {
            const existingValue = testAreaModel.isPlaying;
            testArea.isPlaying = existingValue;
            expect(mockListeners.playbackChange).not.toBeCalled();
        });
    });
    describe('listeningAreaModel', () => {
        it('Carries through all of the properties', () => {
            const model = testArea.listeningAreaModel();
            expect(model).toEqual(testAreaModel);
        });
    });
    describe('updateFrom', () => {
        it('Updates the isPlaying and song properties', () => {
            const newModel: ListeningArea = {
                id: testAreaModel.id,
                song: nanoid(),
                isPlaying: !testArea.isPlaying,
            };
            testArea.updateFrom(newModel);
            expect(testArea.song).toEqual(newModel.song);
            expect(testArea.isPlaying).toEqual(newModel.isPlaying);
            expect(mockListeners.songChange).toBeCalledWith(newModel.song);
            expect(mockListeners.playbackChange).toBeCalledWith(newModel.isPlaying);
        });
        it('Does not update the id property', () => {
            const existingID = testArea.id;
            const newModel: ListeningArea = {
                id: nanoid(),
                song: nanoid(),
                isPlaying: !testArea.isPlaying,
            };
            testArea.updateFrom(newModel);
            expect(testArea.id).toEqual(existingID);
        });
    });
});
