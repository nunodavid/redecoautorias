# Rede de Coautorias

The tool Rede de Coautorias is meant for the analysis of scientific collaborations using data from [Ciência-IUL](https://ciencia.iscte-iul.pt/), the digital repository of [ISCTE-IUL](https://www.iscte-iul.pt/).

## Getting Started

Please install the softwares:

* [Node.js](https://nodejs.org) - minimum version: 6.9.4
* [MongoDB](https://www.mongodb.com/) - minimum version: 3.4.1

```
You have to assure that npm, the package manager for JavaScript, is installed with Node.js.
```

MCL is not necessary for the project to function, only the MCL community detection module:

* [MCL](https://micans.org/mcl/)


### Installing the Database

After installing MongoDB, you have to create the database and its collections.

```
use redecoautorias
db.createCollection('authors')
db.createCollection('publications')
db.createCollection('coauthorships')
db.createCollection('authorsInCommunity')
db.createCollection('publicationsInCommunity')
db.createCollection('coauthorshipsInCommunity')
db.createCollection('communityJobs')
db.createCollection('CacheVisjsStoredGraphs')
```

### Using Google OAuth 2.0 for Web Server Applications

[Google Identity Platform](https://developers.google.com/identity/protocols/OAuth2WebServer)

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Atom](https://atom.io/) - A "hackable" text editor

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
