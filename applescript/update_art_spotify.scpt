tell application "Finder"
	set current_path to container of container of (path to me) as alias
	set current_path to (current_path as text) & ".tmp:"
	set current_path to POSIX path of current_path
end tell

tell application "Spotify"
	try
		if player state is not stopped then
			set albumUrl to (get artwork url of current track)
		end if
		do shell script "curl -f '" & albumUrl & "' -o " & ((current_path) & "spotify.png")
		
	end try
end tell
