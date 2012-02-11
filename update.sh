#!/bin/bash

DATE=`date '+%s'`
GITHASH=`git log -1 | grep -E '^commit' | cut -d' ' -f2`

for FILE in *.in; do
	OUTFILE="${FILE/.in/}"
	sed -e "s,@DATE@,$DATE,g" -e "s,@GITHASH@,$GITHASH,g" "$FILE" > "$OUTFILE"
done
