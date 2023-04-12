import {
  Button,
  Flex,
  Box,
  Text,
  Image,
  List,
  ListItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useListeningAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { ListeningArea as ListeningAreaModel } from '../../../types/CoveyTownSocket';
import ListeningArea from './ListeningArea';
import { SpotifyWebApi } from 'spotify-web-api-ts';
import { Card } from '@material-ui/core';
import { Track } from 'spotify-web-api-ts/types/types/SpotifyObjects';

export default function SelectListeningModal({
  isOpen,
  close,
  listeningArea,
}: {
  isOpen: boolean;
  close: () => void;
  listeningArea: ListeningArea;
}): JSX.Element {
  const [spotifyResponseData, setsSpotifyResponseData] = useState<object | null>(null);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string>('a');
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string>('r');
  const [spotifyUserName, setSpotifyUserName] = useState<string>('');

  const toast = useToast();

  const clientID = 'a8996d7026884859b477604c26cbb5ed';
  const clientSecret = '7ae24d76f1064542b3f163b1abdc9463';

  const base64AuthString = btoa(`${clientID}:${clientSecret}`);
  const redirectURI = 'http://localhost:3000/';
  const scopes =
    'user-read-private user-read-email user-library-read user-read-recently-played playlist-modify-public playlist-modify-private streaming playlist-read-collaborative user-top-read user-read-recently-played user-read-playback-state user-modify-playback-state';
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';

  const handleSpotifyLogin = async () => {
    const authURL = `${authEndpoint}?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scopes}`;
    const popupWindow = window.open(authURL, 'Popup', 'width=600,height=400');

    const pollPopup = await setInterval(async () => {
      if (!popupWindow || popupWindow.closed || popupWindow.closed === undefined) {
        clearInterval(pollPopup);
        return;
      }

      try {
        if (popupWindow.location.href.includes(redirectURI)) {
          const urlParams = new URLSearchParams(popupWindow.location.search);
          const code = urlParams.get('code');
          popupWindow.close(); // Exchange authorization code for access token and refresh token

          const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${clientID}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
              grant_type: `authorization_code`,
              code: `${code}`,
              redirect_uri: redirectURI,
            }),
          });

          const data = await response.json();

          console.log(data); // eslint-disable-next-line @typescript-eslint/naming-convention

          const { access_token, refresh_token } = data;

          await setsSpotifyResponseData(data);
          await setSpotifyAccessToken(access_token);
          await setSpotifyRefreshToken(refresh_token);

          localStorage.setItem('spotifyAccessToken', access_token);
          localStorage.setItem('spotifyRefreshToken', refresh_token);
        } else {
          console.log('not ready yet');
        }
      } catch (error) {
        console.log(error);
      }
    }, 1000);
  };
  const spotify = new SpotifyWebApi({ accessToken: spotifyAccessToken });
  const coveyTownController = useTownController();
  const listeningAreaController = useListeningAreaController(listeningArea?.name);

  const [songSet, setSongSet] = useState<string>(listeningArea?.defaultSong || '');
  const [songQueue, setSongQueue] = useState<string>(listeningArea?.defaultSong || '');
  const [areaSong, setAreaSong] = useState<string>(listeningArea?.defaultSong || '');
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);

  useEffect(() => {
    if (isOpen) {
      coveyTownController.pause();
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, isOpen]);

  const closeModal = useCallback(() => {
    coveyTownController.unPause();
    close();
  }, [coveyTownController, close]);

  const createListeningArea = useCallback(async () => {
    if (areaSong && listeningAreaController) {
      const request: ListeningAreaModel = {
        id: listeningAreaController.id,
        song: areaSong,
        isPlaying: true,
      };
      try {
        await coveyTownController.createListeningArea(request);
        toast({
          title: 'Song set!',
          status: 'success',
        });
        coveyTownController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to set song URL',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [areaSong, coveyTownController, listeningAreaController, toast]);

  const [isPaused, setIsPaused] = useState(false);

  const handlePauseClick = async () => {
    if (isPaused) {
      const success = await spotify.player.play();
      console.log(success);
      setIsPaused(false);
    } else {
      const success = await spotify.player.pause();
      console.log(success);
      setIsPaused(true);
    }
  };
  const handlePrev = async () => {
    const success = await spotify.player.skipToPrevious();
    console.log(success);
  };
  const handleSkip = async () => {
    const success = await spotify.player.skipToNext();
    console.log(success);
  };
  const handleShuffle = async () => {
    const success = await spotify.player.setShuffle(true);
    console.log(success);
  };
  const handleGetSongClick = async () => {
    const { name } = await spotify.tracks.getTrack('6LN15vwkSE1ZiA8IdBjl7k');

    console.log(name);
  };

  const searchSong = async () => {
    const tracks = await spotify.search.searchTracks(songSet);
    if (tracks.items.length > 0) {
      setSearchTracks(tracks.items);
    }
  };

  const playSong = async (song: string) => {
    console.log(song);
    const success = await spotify.player.play({
      uris: [song],
    });
    console.log(success);
  };

  const queueSong = async (ev: Event, track: Track) => {
    ev.preventDefault();
    const success = await spotify.player.addToQueue(track.uri);
    console.log(success);
    setQueue([...queue, track]);
    // } else {
    //   toast({
    //     title: 'Song not found',
    //     status: 'error',
    //   });
    // }
  };
  const handleSetListeningAreaSong = async () => {
    const track = await spotify.player.getCurrentlyPlayingTrack();
    if (track) {
      const currTrack = typeof track === 'string' ? track : track.item;
      if (currTrack) {
        const currURI = typeof currTrack === 'string' ? currTrack : currTrack.uri;
        console.log(currURI);
        listeningAreaController.song = currURI;
        listeningArea.defaultSong = currURI;
        setAreaSong(currURI);
        createListeningArea();
      } else {
        toast({
          title: 'No song playing',
          status: 'error',
        });
      }
    } else {
      toast({
        title: 'No song playing',
        status: 'error',
      });
    }
  };

  const handlePlayListeningAreaSong = async () => {
    console.log(listeningArea.defaultSong);
    console.log(areaSong);
    console.log(listeningAreaController.song);
    const playURI = listeningAreaController.song
      ? listeningAreaController.song
      : listeningArea.defaultSong;
    const success = await spotify.player.play({
      uris: [playURI],
    });
    console.log(success);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pick a song to listen to {listeningAreaController?.id} </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createListeningArea();
          }}>
          <ModalBody pb={6}>
            <Flex flexDirection='column' alignItems='center'>
              <Flex justifyContent='center' alignItems='center' mb={4}>
                <Button colorScheme='green' mr={2} onClick={searchSong}>
                  Search
                </Button>
                <Input
                  id='song'
                  name='song'
                  value={songSet}
                  onChange={e => setSongSet(e.target.value)}
                />
              </Flex>
              <Box height='300px' overflow='auto'>
                <Flex
                  wrap='wrap'
                  justify='center'
                  alignItems={'stretch'}
                  gridTemplateColumns='repeat(3, 1fr)'
                  gridGap={16}
                  flexGrow={1}
                  pb={18}>
                  {searchTracks.map(track => (
                    <Box
                      key={track.id}
                      width='100px'
                      height='100px'
                      onClick={() => playSong(track.uri)}
                      onContextMenu={ev => queueSong(ev, track)}
                      cursor='pointer'>
                      <Card>
                        <Image src={track.album.images[0].url} alt={track.name} />
                        <Text isTruncated>{track.name}</Text>
                        <Text isTruncated>{track.artists[0].name}</Text>
                      </Card>
                    </Box>
                  ))}
                </Flex>
              </Box>
              <Box>
                <Text> Queue </Text>
                <List overflowY='scroll' maxH='100px'>
                  {queue.map(song => (
                    <ListItem key={song.id}>
                      {song.name} - {song.artists[0].name}
                    </ListItem>
                  ))}
                </List>
              </Box>
              {/* <Flex justifyContent='center' alignItems='center' mb={4}>
                <Button colorScheme='green' mr={2} onClick={queueSong}>
                  Queue Song
                </Button>
                <Input
                  id='song'
                  name='song'
                  value={songQueue}
                  onChange={e => setSongQueue(e.target.value)}
                />
              </Flex> */}
              <Flex justifyContent='center' alignItems='center'>
                <Button colorScheme='green' mr={3} onClick={handlePrev}>
                  {'<'}
                </Button>
                <Button colorScheme='green' mr={3} onClick={handlePauseClick}>
                  {isPaused ? '▷' : '□'}
                </Button>
                <Button colorScheme='green' mr={3} onClick={handleSkip}>
                  {'>'}
                </Button>
                <Button colorScheme='green' mr={3} onClick={handleShuffle}>
                  {'🔀'}
                </Button>
              </Flex>
            </Flex>
            <Flex justifyContent='center' alignItems='center'>
              <Button colorScheme='green' mr={3} onClick={handleSetListeningAreaSong}>
                Set Song for Area
              </Button>
              <Button colorScheme='green' mr={3} onClick={handlePlayListeningAreaSong}>
                Play Area Song
              </Button>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='green' mr={3} onClick={handleSpotifyLogin}>
              Login
            </Button>
            <Button colorScheme='green' mr={3} onClick={handleGetSongClick}>
              Song Name
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
