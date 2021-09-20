// create variable to hold database info
let db;

// establish connection to IndexedDB db called 'budget_tracker" and set to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called 'new_transaction'
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    db = event.target.result;

    // check if app is online, if true upload indexedDB data to api
    if (navigator.online) {
        uploadTransaction()
    }
};

request.onerror = function (event) {
    // log error in console
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    transactionObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in the indexedDB's store, send to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }

                // open one more transaction
                const transaction = db.transaction(['new_transaction', 'readwrite']);
                // access the new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }

    };
};

// listen for app coming back online
window.addEventListener('online', uploadTransaction);
