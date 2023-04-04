import React, { useCallback, useEffect, useState } from 'react';
import assert from 'assert';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { Town } from '../../generated/client';
import useLoginController from '../../hooks/useLoginController';
import TownController from '../../classes/TownController';
import useVideoContext from '../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext';

export default function TownSelection(): JSX.Element {
  const [userName, setUserName] = useState<string>('');
  const [newTownName, setNewTownName] = useState<string>('');
  const [newTownIsPublic, setNewTownIsPublic] = useState<boolean>(true);
  const [townIDToJoin, setTownIDToJoin] = useState<string>('');
  const [currentPublicTowns, setCurrentPublicTowns] = useState<Town[]>();
  const loginController = useLoginController();
  const { setTownController, townsService } = loginController;
  const { connect: videoConnect } = useVideoContext();

  const [spotifyResponseData, setsSpotifyResponseData] = useState<object | null>(null);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string>('a');
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string>('r');
  const [spotifyUserName, setSpotifyUserName] = useState<string>('');

  const toast = useToast();

  const clientID = '6090986dbddf45deab41b4a704cbf506';
  const clientSecret = '7d218af54e1e4a1e859dff272cb107d6';

  const base64AuthString = btoa(`${clientID}:${clientSecret}`);
  const redirectURI = 'http://localhost:3000/';
  const scopes =
    'user-read-private user-read-email user-library-read user-read-recently-played playlist-modify-public playlist-modify-private streaming playlist-read-collaborative user-top-read user-read-recently-played';
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';

  const updateTownListings = useCallback(() => {
    townsService.listTowns().then(towns => {
      setCurrentPublicTowns(towns.sort((a, b) => b.currentOccupancy - a.currentOccupancy));
    });
  }, [setCurrentPublicTowns, townsService]);

  useEffect(() => {
    updateTownListings();
    const timer = setInterval(updateTownListings, 2000);
    return () => {
      clearInterval(timer);
    };
  }, [updateTownListings]);

  const handleJoin = useCallback(
    async (coveyRoomID: string) => {
      try {
        if (!userName || userName.length === 0) {
          toast({
            title: 'Unable to join town',
            description: 'Please select a username',
            status: 'error',
          });
          return;
        }
        if (!coveyRoomID || coveyRoomID.length === 0) {
          toast({
            title: 'Unable to join town',
            description: 'Please enter a town ID',
            status: 'error',
          });
          return;
        }
        const newController = new TownController({
          userName,
          townID: coveyRoomID,
          loginController,
        });
        await newController.connect();
        const videoToken = newController.providerVideoToken;
        assert(videoToken);
        await videoConnect(videoToken);
        setTownController(newController);
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to connect to Towns Service',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected error, see browser console for details.',
            status: 'error',
          });
        }
      }
    },
    [setTownController, userName, toast, videoConnect, loginController],
  );

  const handleCreate = async () => {
    if (!userName || userName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please select a username before creating a town',
        status: 'error',
      });
      return;
    }
    if (!newTownName || newTownName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please enter a town name',
        status: 'error',
      });
      return;
    }
    try {
      const newTownInfo = await townsService.createTown({
        friendlyName: newTownName,
        isPubliclyListed: newTownIsPublic,
      });
      let privateMessage = <></>;
      if (!newTownIsPublic) {
        privateMessage = (
          <p>
            This town will NOT be publicly listed. To re-enter it, you will need to use this ID:{' '}
            {newTownInfo.townID}
          </p>
        );
      }
      toast({
        title: `Town ${newTownName} is ready to go!`,
        description: (
          <>
            {privateMessage}Please record these values in case you need to change the town:
            <br />
            Town ID: {newTownInfo.townID}
            <br />
            Town Editing Password: {newTownInfo.townUpdatePassword}
          </>
        ),
        status: 'success',
        isClosable: true,
        duration: null,
      });
      await handleJoin(newTownInfo.townID);
    } catch (err) {
      if (err instanceof Error) {
        toast({
          title: 'Unable to connect to Towns Service',
          description: err.toString(),
          status: 'error',
        });
      } else {
        console.trace(err);
        toast({
          title: 'Unexpected error, see browser console for details.',
          status: 'error',
        });
      }
    }
  };

  const getCurrentUser = async (access_token: string) => {
    const searchOptions = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };
    const searchResponse = await fetch('https://api.spotify.com/v1/me', searchOptions);
    const searchData = await searchResponse.json();
    await setSpotifyUserName(searchData.id);
    localStorage.setItem('spotifyUserName', searchData.id);
    console.log('getCurrentUser', searchData);
  };

  const getUserProfile = async (access_token: string, userId: string) => {
    const searchOptions = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const searchResponse = await fetch(`https://api.spotify.com/v1/users/${userId}`, searchOptions);
    const searchData = await searchResponse.json();
    console.log('getUserProfile:', searchData);
  };

  const getRecentlyPlayed = async (access_token: string) => {
    const searchOptions = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };

    const searchResponse = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played',
      searchOptions,
    );
    const searchData = await searchResponse.json();
    console.log('getRecentlyPlayed:', searchData);
  };

  const getTopItems = async (accessToken: string, topType: string) => {
    const searchOptions = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/me/top/${topType}?limit=10`,
      searchOptions,
    );
    const searchData = await searchResponse.json();
    console.log(`getTop_${topType}:`, searchData);
  };

  const createPlaylist = async (
    access_token: string,
    playListFor: string,
    playlistName: string,
    description = '',
    isPublic = false,
    isCollaborative = false,
  ) => {
    const createOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${playlistName}`,
        description: `${description}`,
        public: isPublic,
        collaborative: isCollaborative,
      }),
    };

    const createResponse = await fetch(
      `https://api.spotify.com/v1/users/${playListFor}/playlists`,
      createOptions,
    );
    const createData = await createResponse.json();
    console.log('createPlaylist:', createData);
  };

  /* Spotify Login
   * using the spotify username and password, we can get the user's access token and login to spotify
   */
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
          popupWindow.close();

          // Exchange authorization code for access token and refresh token
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

          console.log(data);

          const { access_token, refresh_token } = data;

          //console.log(`Access token: ${access_token}`, `\nRefresh token: ${refresh_token}`);
          await getCurrentUser(access_token);
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

  // mini test suite for the Spotify API
  useEffect(() => {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    //const refreshToken = localStorage.getItem('spotifyRefreshToken');
    const spUserName = localStorage.getItem('spotifyUserName');

    if (accessToken !== null && spUserName !== null) {
      getCurrentUser(spotifyAccessToken);
      console.log('Spotify access token 1:', accessToken);
      console.log('Username:', spUserName);

      getUserProfile(accessToken, spUserName);
      getRecentlyPlayed(accessToken);

      getTopItems(accessToken, 'artists');
      getTopItems(accessToken, 'tracks');

      createPlaylist(accessToken, spUserName, 'test playlist', 'test description', false, false);
    }
    //console.log('A token:', spotifyResponseData);
    /*
    const accessToken = localStorage.getItem('spotifyAccessToken');
    const refreshToken = localStorage.getItem('spotifyRefreshToken');
    if (accessToken && refreshToken) {
      setSpotifyAccessToken(accessToken);
      setSpotifyRefreshToken(refreshToken);
    }
    */
  }, [spotifyRefreshToken]);

  return (
    <>
      <form>
        <Stack>
          <Box p='4' borderWidth='1px' borderRadius='lg'>
            <Heading as='h2' size='lg'>
              Spotify Login
            </Heading>
            <Box p='4' borderRadius='lg'>
              {}
            </Box>
            <Button backgroundColor={'green.400'} onClick={handleSpotifyLogin}>
              Login
            </Button>
          </Box>

          <Box p='4' borderWidth='1px' borderRadius='lg'>
            <Heading as='h2' size='lg'>
              Select a username
            </Heading>

            <FormControl>
              <FormLabel htmlFor='name'>Name</FormLabel>
              <Input
                autoFocus
                name='name'
                placeholder='Your name'
                value={userName}
                onChange={event => setUserName(event.target.value)}
              />
            </FormControl>
          </Box>
          <Box borderWidth='1px' borderRadius='lg'>
            <Heading p='4' as='h2' size='lg'>
              Create a New Town
            </Heading>
            <Flex p='4'>
              <Box flex='1'>
                <FormControl>
                  <FormLabel htmlFor='townName'>New Town Name</FormLabel>
                  <Input
                    name='townName'
                    placeholder='New Town Name'
                    value={newTownName}
                    onChange={event => setNewTownName(event.target.value)}
                  />
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel htmlFor='isPublic'>Publicly Listed</FormLabel>
                  <Checkbox
                    id='isPublic'
                    name='isPublic'
                    isChecked={newTownIsPublic}
                    onChange={e => {
                      setNewTownIsPublic(e.target.checked);
                    }}
                  />
                </FormControl>
              </Box>
              <Box>
                <Button data-testid='newTownButton' onClick={handleCreate}>
                  Create
                </Button>
              </Box>
            </Flex>
          </Box>
          <Heading p='4' as='h2' size='lg'>
            -or-
          </Heading>

          <Box borderWidth='1px' borderRadius='lg'>
            <Heading p='4' as='h2' size='lg'>
              Join an Existing Town
            </Heading>
            <Box borderWidth='1px' borderRadius='lg'>
              <Flex p='4'>
                <FormControl>
                  <FormLabel htmlFor='townIDToJoin'>Town ID</FormLabel>
                  <Input
                    name='townIDToJoin'
                    placeholder='ID of town to join, or select from list'
                    value={townIDToJoin}
                    onChange={event => setTownIDToJoin(event.target.value)}
                  />
                </FormControl>
                <Button data-testid='joinTownByIDButton' onClick={() => handleJoin(townIDToJoin)}>
                  Connect
                </Button>
              </Flex>
            </Box>

            <Heading p='4' as='h4' size='md'>
              Select a public town to join
            </Heading>
            <Box maxH='500px' overflowY='scroll'>
              <Table>
                <TableCaption placement='bottom'>Publicly Listed Towns</TableCaption>
                <Thead>
                  <Tr>
                    <Th>Town Name</Th>
                    <Th>Town ID</Th>
                    <Th>Activity</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentPublicTowns?.map(town => (
                    <Tr key={town.townID}>
                      <Td role='cell'>{town.friendlyName}</Td>
                      <Td role='cell'>{town.townID}</Td>
                      <Td role='cell'>
                        {town.currentOccupancy}/{town.maximumOccupancy}
                        <Button
                          onClick={() => handleJoin(town.townID)}
                          disabled={town.currentOccupancy >= town.maximumOccupancy}>
                          Connect
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}
