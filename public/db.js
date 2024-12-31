// This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

class IndexedDB {
    constructor(config) {
        this.dbName = config.dbName;
        this.stores = config.stores;
        this.version = config.version;
        this.db;
    }

    init(success) {
        var open = indexedDB.open(this.dbName, this.version);

        var that = this;
        open.onupgradeneeded = function (event) {
            that.db = event.target.result;
            let transaction = event.target.transaction;
            transaction.oncomplete = function (event) {
                success(that.db);
            }
            that.stores.forEach(function(storeInfo){
                console.log(storeInfo);
                var store = that.db.createObjectStore(storeInfo.name, { keyPath: "id" });
                storeInfo.indices.forEach(function(index){
                    store.createIndex(index.name, index.fields);
                });
            });
            
        };

        open.onsuccess = function (event) {
            that.db = open.result;
            success(that.db);
        }
        open.onerror = function (event) {
            console.error("NO")
            console.error(event);
        }
    }

    get(store, id, success) {
        var tx = this.db.transaction(store, "readwrite");
        var store = tx.objectStore(store);
        let record = store.get(id);
        record.onsuccess = function(e) {
            if (success) success(e.target.result);
        };
        record.onerror = function (e) {
            console.error("Error adding: ", e);
        };
    }

    put(store, data, success) {
        var tx = this.db.transaction(store, "readwrite");
        var store = tx.objectStore(store);
        var request = store.put(data);
        request.onsuccess = function (e) {
            data.id = e.target.result;
            if (success) success(data);
        };
        request.onerror = function (e) {
            console.error("Error adding: ", e);
        };
        tx.oncomplete = function () {
        };
    }

    getAll(store, handler) {
        var tx = this.db.transaction(store, "readonly");
        var store = tx.objectStore(store);
        var request = store.openCursor();
        request.onsuccess = function (evt) {
            var cursor = evt.target.result;
            if (cursor) {
                handler(cursor);
                cursor.continue();
            }
            else {
                // console.log("No more entries!");
            }
        };
    }

    deleteAll(store, handler) {
        var tx = this.db.transaction(store, "readwrite");
        var store = tx.objectStore(store);
        var request = store.clear();
        request.onsuccess = function (evt) {
            handler();
        }
    }

}

