angular-rest-offline
====================

An angularJS module for restFull webapp offline with localStorage. Need manifest.appcache for use

[ ![Codeship Status for jack-in-the-box/angular-rest-offline](https://www.codeship.io/projects/53d5f350-40c2-0132-ed1c-1642c031f119/status)](https://www.codeship.io/projects/43950)

Compatiblity
------------
This module work only with last version of firefox and Chrome. 
TODO IE11


Big Picture
-----------
Sometimes drawing is more efficient than a lot of words
### GET ressources
![Case study for GET ressources] (https://raw.githubusercontent.com/jack-in-the-box/angular-rest-offline/master/doc/getressources.png)

### GET ressources/id
![Case study for GET ressource with id from ressources](https://raw.githubusercontent.com/jack-in-the-box/angular-rest-offline/master/doc/getressourcesid.png)

### POST a new ressource
![Case study for POST a new ressource](https://raw.githubusercontent.com/jack-in-the-box/angular-rest-offline/master/doc/postressources.png)




Sample
------
```javascript
OfflineServiceProvider.setApiUrl("/api/");
OfflineServiceProvider.setApis([
    {
        ressource: "ressources",
        finder: function(collection, key) {
            var self = this;
            return _.find(collection, function(item) {
                return (item.id === key) || self.finder(item.children || [], key)
            });
        }
    }
]);
```
