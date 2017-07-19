# Rede de Coautorias

The tool Rede de Coautorias is meant for the analysis of scientific collaborations using data from [Ciência-IUL](https://ciencia.iscte-iul.pt/), the digital repository of [ISCTE-IUL](https://www.iscte-iul.pt/).

## Getting Started

Please install the softwares:

* [Node.js](https://nodejs.org) - minimum version: 6.9.4
* [MongoDB](https://www.mongodb.com/) - minimum version: 3.4.1

```
You have to assure that npm, the package manager for JavaScript, is installed with Node.js.
```

MCL is not necessary for the project to work, only the MCL community detection module:

* [MCL](https://micans.org/mcl/)

```
In the file thirdpartysoftware\mcl-latest.tar.gz you have the source code and you can compile it. Although I recommend you use the official site.
```

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

###  Setting the Google OAuth 2.0

In order to use the authentication you have to create an application in the [Google Identity Platform](https://developers.google.com/identity/protocols/OAuth2WebServer). Then you have to set the properties *googleId* (the  client ID) and *googleSecret* (the client secret) in the core/configuration.js file. Also in the same file, you have to set the callback URI by Google after the client authentication with the property *googleCallbackURL*. This URI has to be configured also in the **Google Identity Platform**.

## Preparing the core/configuration.js

```
The *core/configuration.template.js* has to be renamed to *core/configuration.js*.
```

The *core/configuration.js* is the configuration provider of the application. You have to manually set the *cookieSecret* and the *AdminUsersEmails* properties. The *ciencieIULsjrCategories* and *ciencieIULsjrInfos* properties represent the filepaths to the [Scimago](http://www.scimagojr.com/) publications classifications paths. The application do not require them to work and only the [Ciência-IUL](https://ciencia.iscte-iul.pt/) administration can give you them. Also, read the **Setting the Google OAuth 2.0** to another required configurations.

## Built With

* [Atom](https://atom.io/) - A "hackable" text editor
