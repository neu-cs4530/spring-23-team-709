import { Container } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useInteractable, useListeningAreaController } from '../../../classes/TownController';
import ListeningAreaController from '../../../classes/ListeningAreaController';
import useTownController from '../../../hooks/useTownController';
import SelectListeningModal from './SelectListeningModal';
import ListeningAreaInteractable from './ListeningArea';

export class MockReactPlayer extends ReactPlayer {
  render(): React.ReactNode {
    return <></>;
  }
}

/**
 * The ViewingAreaVideo component renders a ViewingArea's video, using the ReactPlayer component.
 * The URL property of the ReactPlayer is set to the ViewingAreaController's video property, and the isPlaying
 * property is set, by default, to the controller's isPlaying property.
 *
 * The ViewingAreaVideo subscribes to the ViewingAreaController's events, and responds to
 * playbackChange events by pausing (or resuming) the video playback as appropriate. In response to
 * progressChange events, the ViewingAreaVideo component will seek the video playback to the same timecode.
 * To avoid jittering, the playback is allowed to drift by up to ALLOWED_DRIFT before seeking: the video should
 * not be seek'ed to the newTime from a progressChange event unless the difference between the current time of
 * the video playback exceeds ALLOWED_DRIFT.
 *
 * The ViewingAreaVideo also subscribes to onProgress, onPause, onPlay, and onEnded events of the ReactPlayer.
 * In response to these events, the ViewingAreaVideo updates the ViewingAreaController's properties, and
 * uses the TownController to emit a viewing area update.
 *
 * @param props: A single property 'controller', which is the ViewingAreaController corresponding to the
 * current viewing area.
 */
export function ListeningAreaSong({
  controller,
}: {
  controller: ListeningAreaController;
}): JSX.Element {
  const [isPlaying, setPlaying] = useState<boolean>(controller.isPlaying);
  const townController = useTownController();

  const reactPlayerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    controller.addListener('playbackChange', setPlaying);
    return () => {
      controller.removeListener('playbackChange', setPlaying);
    };
  }, [controller]);

  return (
    <Container className='participant-wrapper'>
      Listening Area: {controller.id}
      <ReactPlayer
        url={controller.song}
        ref={reactPlayerRef}
        config={{
          youtube: {
            playerVars: {
              // disable skipping time via keyboard to avoid weirdness with chat, etc
              disablekb: 1,
              autoplay: 1, // modestbranding: 1,
            },
          },
        }}
        playing={isPlaying}
        // onProgress={state => {
        //   if (state.playedSeconds != 0 && state.playedSeconds != controller.elapsedTimeSec) {
        //     controller.elapsedTimeSec = state.playedSeconds;
        //     townController.emitListeningAreaUpdate(controller);
        //   }
        // }}
        onPlay={() => {
          if (!controller.isPlaying) {
            controller.isPlaying = true;
            townController.emitListeningAreaUpdate(controller);
          }
        }}
        onPause={() => {
          if (controller.isPlaying) {
            controller.isPlaying = false;
            townController.emitListeningAreaUpdate(controller);
          }
        }}
        onEnded={() => {
          if (controller.isPlaying) {
            controller.isPlaying = false;
            townController.emitListeningAreaUpdate(controller);
          }
        }}
        controls={true}
        width='100%'
        height='100%'
      />
    </Container>
  );
}

/**
 * The ViewingArea monitors the player's interaction with a ViewingArea on the map: displaying either
 * a popup to set the video for a viewing area, or if the video is set, a video player.
 *
 * @param props: the viewing area interactable that is being interacted with
 */
export function ListeningArea({
  listeningArea,
}: {
  listeningArea: ListeningAreaInteractable;
}): JSX.Element {
  const townController = useTownController();
  const listeningAreaController = useListeningAreaController(listeningArea.name);
  const [selectIsOpen, setSelectIsOpen] = useState(listeningAreaController.song === undefined);
  const [listeningAreaSong, setListeningAreaSong] = useState(listeningAreaController.song);
  useEffect(() => {
    const setURL = (url: string | undefined) => {
      if (!url) {
        townController.interactableEmitter.emit('endIteraction', listeningAreaController);
      } else {
        setListeningAreaSong(url);
      }
    };
    listeningAreaController.addListener('songChange', setURL);
    return () => {
      listeningAreaController.removeListener('songChange', setURL);
    };
  }, [listeningAreaController, townController]);

  if (listeningAreaSong) {
    return (
      <SelectListeningModal
        isOpen={true}
        close={() => {
          setSelectIsOpen(false); // forces game to emit "viewingArea" event again so that // repoening the modal works as expected
          townController.interactEnd(listeningArea);
        }}
        listeningArea={listeningArea}
      />
    );
  }
  return (
    <>
      <ListeningAreaSong controller={listeningAreaController} />
    </>
  );
}

/**
 * The ViewingAreaWrapper is suitable to be *always* rendered inside of a town, and
 * will activate only if the player begins interacting with a viewing area.
 */
export default function ListeningAreaWrapper(): JSX.Element {
  const listeningArea = useInteractable<ListeningAreaInteractable>('listeningArea');
  if (listeningArea) {
    return <ListeningArea listeningArea={listeningArea} />;
  }
  return <></>;
}
