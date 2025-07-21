import { Rail } from "@/app/components/Rail";
import { Card } from "@/app/components/Card";
import { notEmpty, pickImg, joinArtists } from "@/utils/spotifyHelpers";

export default function SpotifySearch(props) {
  const { data, accessToken, setQueue } = props;

  const artists = (data?.artists?.items || []).filter(notEmpty);
  const albums = (data?.albums?.items || []).filter(notEmpty);
  const tracks = (data?.tracks?.items || []).filter(notEmpty);
  const playlists = (data?.playlists?.items || []).filter(notEmpty);

  const getQueue = async () => {
    const response = await fetch(
      " https://api.spotify.com/v1/me/player/queue ",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    setQueue(await response.json());
  };

  const setShuffleOff = async () => {
    await fetch("https://api.spotify.com/v1/me/player/shuffle?state=false", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  };

  const setShuffleOn = async () => {
    await fetch("https://api.spotify.com/v1/me/player/shuffle?state=true", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  };

  const playAlbum = async (id) => {
    await setShuffleOff();
    fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: `spotify:album:${id}`,
      }),
    });
    await getQueue();
  };

  const playPlaylist = async (id) => {
    await setShuffleOn()
    fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: `spotify:playlist:${id}`,
      }),
    });
    await getQueue();
  };

  const playTrack = async (uri, start) => {
    await setShuffleOn();
    fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });
    await getQueue();
  };

  const playArtist = async (id) => {
    await setShuffleOn();
    fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: `spotify:artist:${id}`,
      }),
    });
    await getQueue();
  };

  return (
    <div className="space-y-10">
      {/* Artists */}
      <Rail title="Artists" empty={artists.length === 0}>
        {artists.map((a) => (
          <Card
            key={a.id}
            img={pickImg(a.images)}
            title={a.name}
            subtitle={`${a.followers?.total?.toLocaleString() || 0} followers`}
            func={async () => await playArtist(a.id)}
          />
        ))}
      </Rail>

      {/* Albums */}
      <Rail title="Albums" empty={albums.length === 0}>
        {albums.map((al) => (
          <Card
            key={al.id}
            img={pickImg(al.images)}
            title={al.name}
            subtitle={joinArtists(al.artists)}
            meta={al.release_date?.slice(0, 4)}
            func={async () => await playAlbum(al.id)}
          />
        ))}
      </Rail>

      {/* Tracks */}
      <Rail title="Tracks" empty={tracks.length === 0}>
        {tracks.map((t) => (
          <Card
            key={t.id}
            img={pickImg(t.album?.images, 100)}
            title={t.name}
            subtitle={joinArtists(t.artists)}
            meta={`${Math.round(t.duration_ms / 1000)}s`}
            func={async () => await playTrack(t.uri)}
          />
        ))}
      </Rail>

      {/* Playlists */}
      <Rail title="Playlists" empty={playlists.length === 0}>
        {playlists.map((p) => (
          <Card
            key={p.id}
            img={pickImg(p.images)}
            title={p.name}
            subtitle={p.owner?.display_name || "Unknown"}
            meta={`${p.tracks?.total || 0} tracks`}
            func={async () => await playPlaylist(p.id)}
          />
        ))}
      </Rail>
    </div>
  );
}
