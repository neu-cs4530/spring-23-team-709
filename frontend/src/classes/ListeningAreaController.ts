import { EventEmitter } from 'events';
import TypedEventEmitter from 'typed-emitter';
import { ListeningArea as ListeningAreaModel } from '../types/CoveyTownSocket';

/**
 * The events that a ListeningAreaController can emit
 */
export type ListeningAreaEvents = {
    /**
     * A playbackChange event indicates that the playing/paused state has changed.
     * Listeners are passed the new state in the parameter `isPlaying`
     */
    playbackChange: (isPlaying: boolean) => void;
    /**
     * A progressChange event indicates that the progress of the video has changed, either
     * due to the user scrubbing through the video, or from the natural progression of time.
     * Listeners are passed the new playback time elapsed in seconds.
    */
    progressChange: (elapsedTimeSec: number) => void;
    /**
     * A songChange event indicates that the song selected for this li area has changed.
     * Listeners are passed the new song.
     */
    songChange: (song: string | undefined) => void;
};

/**
 * A ListeningAreaController manages the state for a ListeningArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The ListeningAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see ListeningAreaEvents
 */
export default class ListeningAreaController extends (EventEmitter as new () => TypedEventEmitter<ListeningAreaEvents>) {
    private _model: ListeningAreaModel;
    /**
     * Constructs a new ListeningAreaController, initialized with the state of the
     * provided listeningAreaModel.
     *
     * @param listeningAreaModel The listening area model that this controller should represent
     */
    constructor(listeningAreaModel: ListeningAreaModel) {
        super();
        this._model = listeningAreaModel;
    }

    /**
     * The ID of the listening area represented by this listening area controller
     * This property is read-only: once a ListeningAreaController is created, it will always be
     * tied to the same listening area ID.
     */
    public get id() {
        return this._model.id;
    }

    /**
     * The URL of the video assigned to this listening area, or undefined if there is not one.
     */
    public get song() {
        return this._model.song;
    }

    /**
     * The URL of the video assigned to this listening area, or undefined if there is not one.
     *
     * Changing this value will emit a 'videoChange' event to listeners
     */
    public set song(song: string | undefined) {
        if (this._model.song !== song) {
            this._model.song = song;
            this.emit('songChange', song);
        }
    }

    /**
     * The playback state - true indicating that the video is playing, false indicating
     * that the video is paused.
     */
    public get isPlaying() {
        return this._model.isPlaying;
    }

    /**
     * The playback state - true indicating that the video is playing, false indicating
     * that the video is paused.
     *
     * Changing this value will emit a 'playbackChange' event to listeners
     */
    public set isPlaying(isPlaying: boolean) {
        if (this._model.isPlaying != isPlaying) {
            this._model.isPlaying = isPlaying;
            this.emit('playbackChange', isPlaying);
        }
    }

    /**
     * @returns ListeningAreaModel that represents the current state of this ListeningAreaController
     */
    public listeningAreaModel(): ListeningAreaModel {
        return this._model;
    }

    /**
     * Applies updates to this listening area controller's model, setting the fields
     * isPlaying, elapsedTimeSec and video from the updatedModel
     *
     * @param updatedModel
     */
    public updateFrom(updatedModel: ListeningAreaModel): void {
        this.isPlaying = updatedModel.isPlaying;
        this.song = updatedModel.song;
    }
}
