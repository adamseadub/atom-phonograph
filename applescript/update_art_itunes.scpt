tell application "Finder"
    set current_path to container of (path to me) as alias
    set current_path to container of current_path
end tell

if application "iTunes" is running then
  set currentTrack to missing value
  try
    tell application "iTunes"
      set currentTrack to current track
    end tell
  end try

  if currentTrack is not missing value then
    tell application "iTunes" to tell artwork 1 of current track
      set d to raw data
    end tell

    ((current_path as text) & ".tmp:itunes.png")
    set b to open for access file result with write permission
    set eof b to 0
    write d to b
    close access b
  end if
end if