# PH-Website

http://www.purduehackers.com/

# Getting started

### Prerequisites

-  [NodeJS](https://nodejs.org/en/)
-  [MongoDB](https://docs.mongodb.com/manual/installation/)
-  [Yarn](https://yarnpkg.com/en/docs/install)
-  [Homebrew](https://brew.sh/) \*Only on Mac
-  [Docker](https://www.docker.com/)
-  [Docker Compose](https://docs.docker.com/compose/install/)

### Cloning the repo

-  `git clone REPO_URL --recursive` \* Replace "REPO_URL" with the url of this git repo

### Setup

1. `sh setup.sh`

### Docker Commands
* To start: `docker-compose up`
* To stop:
	1. Ctrl+C when inside `docker-compose up`
	2. `docker-compose down`
* To build: `docker-compose build`

### Frontend usage

1. `cd frontend`
2. `yarn start`

### Backend usage

1. `cd backend`
2. Edit .env

-  Ask `webmaster` about what to change

3. Add purduehackers.json to `backend` folder

-  Ask `webmaster` to get this file

4. Make sure MongoDB is running:

-  `mongod`

5. `yarn dev`

## Technologies used:

#### Frontend:

-  [ReactJS](https://reactjs.org/)
-  [ReduxJS](https://redux.js.org/)
-  [ReactRouter](https://github.com/ReactTraining/react-router)
-  [Yarn](https://yarnpkg.com/en/docs/install)

#### Backend:

-  [TypeScript](https://www.typescriptlang.org/)
-  [MongoDB](https://docs.mongodb.com/manual/installation/)
-  [ExpressJS](https://expressjs.com/)
