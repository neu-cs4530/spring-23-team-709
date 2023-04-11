import { Container, FormControl, Input } from '@chakra-ui/react';
import { SpotifyWebApi } from 'spotify-web-api-ts';
import React, { useEffect, useState } from 'react';

const spotify = new SpotifyWebApi({
  clientId: '...',
});

export default function SpotifyPlayer() {
  const accessToken = spotify.getAccessToken();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<
    {
      artist: string;
      title: string;
      uri: string;
      albumUrl: string;
    }[]
  >([]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    spotify.search.searchTracks(search).then(res => {
      setSearchResults(
        res.items.map(track => {
          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: track.album.uri,
          };
        }),
      );
    });
  }, [search, accessToken]);

  return (
    <Container className='display'>
      <FormControl>
        <Input
          type='search'
          placeholder='Search Songs/Artists'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </FormControl>
    </Container>
  );
}
