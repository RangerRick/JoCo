#!/bin/sh

MYDIR=`dirname $0`
TOPDIR=`cd $MYDIR; pwd`

pushd "$TOPDIR" >/dev/null 2>&1

	python -m SimpleHTTPServer 8000

popd >/dev/null 2>&1
