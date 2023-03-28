import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import Player from '../lib/Player';
import {
  BoundingBox,
  TownEmitter,
  ListeningArea as ListeningAreaModel,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class ListeningArea extends InteractableArea {
  private _song?: string;

  private _isPlaying: boolean;

  public get song() {
    return this._song;
  }

  public get isPlaying() {
    return this._isPlaying;
  }

  /**
   * Creates a new ViewingArea
   *
   * @param listeningArea model containing this area's starting state
   * @param coordinates the bounding box that defines this viewing area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { id, isPlaying, song }: ListeningAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._song = song;
    this._isPlaying = isPlaying;
  }

  /**
   * Removes a player from this viewing area.
   *
   * When the last player leaves, this method clears the video of this area and
   * emits that update to all of the players
   *
   * @param player
   */
  public remove(player: Player): void {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._song = undefined;
      this._emitAreaChanged();
    }
  }

  /**
   * Updates the state of this ViewingArea, setting the video, isPlaying and progress properties
   *
   * @param listeningArea updated model
   */
  public updateModel({ isPlaying, song }: ListeningAreaModel) {
    this._song = song;
    this._isPlaying = isPlaying;
  }

  /**
   * Convert this ListeningArea instance to a simple ListeningAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): ListeningAreaModel {
    return {
      id: this.id,
      song: this._song,
      isPlaying: this._isPlaying,
    };
  }

  /**
   * Creates a new ViewingArea object that will represent a Viewing Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this viewing area exists
   * @param townEmitter An emitter that can be used by this viewing area to broadcast updates to players in the town
   * @returns
   */
  public static fromMapObject(mapObject: ITiledMapObject, townEmitter: TownEmitter): ListeningArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new ListeningArea({ isPlaying: false, id: name }, rect, townEmitter);
  }
}
