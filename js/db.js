// Shelby Tracker Database (IndexedDB)

const DB = (() => {

    const DB_NAME = "ShelbyTrackerDB";
    const DB_VERSION = 1;

    let database = null;

    function open() {
        return new Promise((resolve, reject) => {

            if (database) {
                resolve(database);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                database = request.result;
                resolve(database);
            };

            request.onupgradeneeded = (event) => {

                const db = event.target.result;

                const stores = [
                    "gym",
                    "progress",
                    "settings",
                    "dashboard",
                    "notes",
                    "backup"
                ];

                stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store);
                    }
                });
            };

        });
    }

    async function save(store, key, value) {

        const db = await open();

        return new Promise((resolve, reject) => {

            const tx = db.transaction(store, "readwrite");

            tx.objectStore(store).put(value, key);

            tx.oncomplete = () => resolve(true);

            tx.onerror = () => reject(tx.error);

        });

    }

    async function load(store, key) {

        const db = await open();

        return new Promise((resolve, reject) => {

            const tx = db.transaction(store, "readonly");

            const req = tx.objectStore(store).get(key);

            req.onsuccess = () => resolve(req.result);

            req.onerror = () => reject(req.error);

        });

    }

    async function remove(store, key) {

        const db = await open();

        return new Promise((resolve, reject) => {

            const tx = db.transaction(store, "readwrite");

            tx.objectStore(store).delete(key);

            tx.oncomplete = () => resolve(true);

            tx.onerror = () => reject(tx.error);

        });

    }

    async function clear(store) {

        const db = await open();

        return new Promise((resolve, reject) => {

            const tx = db.transaction(store, "readwrite");

            tx.objectStore(store).clear();

            tx.oncomplete = () => resolve(true);

            tx.onerror = () => reject(tx.error);

        });

    }

    return {
        open,
        save,
        load,
        remove,
        clear
    };

})();