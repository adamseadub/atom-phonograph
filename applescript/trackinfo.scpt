set itunesStatus to "closed"
set itunesName to ""
set itunesArtist to ""
set itunesAlbum to ""
set itunesTimeLength to 0
set itunesPos to 0

set spotifyStatus to "closed"
set spotifyName to ""
set spotifyArtist to ""
set spotifyAlbum to ""
set spotifyTimeLength to 0
set spotifyPos to 0

set voxStatus to "closed"
set voxName to ""
set voxArtist to ""
set voxAlbum to ""
set voxTimeLength to 0
set voxPos to 0

if application "iTunes" is running then
	tell application "iTunes"
		set itunesStatus to player state as string
	end tell
	if itunesStatus = "playing" then
		tell application "iTunes"
			set itunesTrack to current track
			tell itunesTrack
				set itunesName to name
				set itunesArtist to artist
				set itunesAlbum to album
				set itunesTimeLength to duration
			end tell
			set itunesPos to player position
		end tell
	end if
end if

if application "Spotify" is running then
	tell application "Spotify"
		set spotifyStatus to player state as string
	end tell
	if spotifyStatus = "playing" then
		tell application "Spotify"
			set spotifyTrack to current track
			tell spotifyTrack
				set spotifyName to name
				set spotifyArtist to artist
				set spotifyAlbum to album
				set spotifyTimeLength to duration
			end tell
			set spotifyPos to player position
		end tell
	end if
end if

"{\"iTunes\":" & ¬
	"{\"track\":\"" & itunesName & "\",\"artist\":\"" & itunesArtist & ¬
	"\",\"status\":\"" & itunesStatus & ¬
	"\",\"album\":\"" & itunesAlbum & ¬
	"\",\"duration\":\"" & itunesTimeLength & ¬
	"\",\"position\":\"" & itunesPos & ¬
	"\"}," & ¬
	"\"Spotify\":" & ¬
	"{\"track\":\"" & spotifyName & "\",\"artist\":\"" & spotifyArtist & ¬
	"\",\"status\":\"" & spotifyStatus & ¬
	"\",\"album\":\"" & spotifyAlbum & ¬
	"\",\"duration\":\"" & spotifyTimeLength & ¬
	"\",\"position\":\"" & spotifyPos & ¬
	"\"}" & ¬
	"}"
