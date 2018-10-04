#!/usr/bin/env bash
cd frontend
yarn
if [ "$1" == "build" ]; then
	yarn build
fi
cd ../backend
yarn
if [ "$1" != "build" ]; then
	cp .env.example .env
fi
