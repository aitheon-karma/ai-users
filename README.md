# Aitheon -  Users


### 1. Setup cluster for developer
- `kubectl` setup required. [install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/).
- Get package with credentials (3 files and sh script) from admin
- Download all files into one folder and navigate to this folder at console
- Run command

```
mv ./setup-cluster.txt ./setup-cluster.sh && chmod +x ./setup-cluster.sh && ./setup-cluster.sh
```


### 2. NPM config to work with private packages

Create a new "readonly" token, following "Working with tokens from the web" at  https://docs.npmjs.com/getting-started/working_with_tokens. 
Replace `00000000-0000-0000-0000-000000000000` below with your token and run it. 

To be able install packages you will need to run this command before each `npm install`

##### 2.0 Ask for a token from a team lead, if you don't have it

##### 2.1 Use an editor `vim` or `nano` and edit a `~/.profile` file
```
nano ~/.profile
```

##### 2.2 append following file with a correct token value
```
export NPM_TOKEN="00000000-0000-0000-0000-000000000000"
```

##### 2.3 Important! Full logout from ubuntu terminal

##### 2.4 Verify all correct
If result of below command is a token then you are good
```
echo $NPM_TOKEN
```

### 3. Install deps and create .env file
```
./init.sh
```

### 4. Run a MongoDB proxy
- Mongo will run on a default port. 
- Mongodb connection string is at .env file. But it will be loaded when app starts
```
./proxy-db.sh
```

### Run client side
```
npm run client:watch
```

### Run Server side
```
npm start
```
Or you can use a VS code to run a server

###### Cleanup node modules
```
rm -rf node_modules package-lock.json
npm cache clear --force
```


<!-- # deploy because of ECR issue -->
