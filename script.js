// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://masina-1b9c4-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase with error handling
let database;

// Initialize Firebase and set up the page
window.onload = function() {
    console.log('Page loaded, pathname:', window.location.pathname);
    
    // Initialize Firebase first
    // Ensure Firebase is initialized before any database operations
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            return;
        }
    }
    database = firebase.database();
    
    // Get the current page filename
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    console.log('Current page name:', pageName);
    
    // Check if we're on a specific chore page using a more robust method
    if (pageName === 'dishwasher.html' || pageName.includes('dishwasher') || currentPath.endsWith('/dishwasher.html')) {
        console.log('On dishwasher page, loading mašina data');
        determineNextPerson('mašina');
        displayChoreHistory('mašina');
    } else if (pageName === 'grocery.html' || pageName.includes('grocery') || currentPath.endsWith('/grocery.html')) {
        console.log('On grocery page, loading granap data');
        determineNextPerson('granap');
        displayChoreHistory('granap');
    } else {
        // We're on the home page or index.html
        console.log('On home page, loading all entries');
        displayEntries();
    }
};

// Remove the DOMContentLoaded event listener since we're using window.onload

let selectedChore = '';

// Navigation function
function navigateToChore(chore) {
    window.location.href = `${chore}.html`;
}

// Go back to home
function goToHome() {
    window.location.href = 'index.html';
}

function confirmChore(name, chore) {
    if (confirm(`${name}, jel lažeš da si uradio ${chore}?`)) {
        const entry = {
            name: name,
            chore: chore,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        // Push the new entry to Firebase
        database.ref('entries').push(entry);
        
        // Refresh the page to update the next person
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// Add error handling for database reads
function determineNextPerson(chore) {
    const nextPersonElement = document.getElementById('nextPerson');
    const tarikCountElement = document.getElementById('tarikCount');
    const kemoCountElement = document.getElementById('kemoCount');
    
    if (!nextPersonElement) {
        console.error('Next person element not found');
        return;
    }
    
    console.log(`Fetching entries for chore: ${chore}`);
    database.ref('entries').orderByChild('chore').equalTo(chore).on('value', (snapshot) => {
        console.log('Received snapshot:', snapshot.val());
        const entries = [];
        snapshot.forEach((childSnapshot) => {
            entries.push(childSnapshot.val());
        });
        
        // Sort by timestamp (newest first)
        entries.sort((a, b) => b.timestamp - a.timestamp);
        
        if (entries.length === 0) {
            nextPersonElement.textContent = "Tarik";
            nextPersonElement.className = "next-person tarik"; // Add both classes
            if (tarikCountElement) tarikCountElement.textContent = 0;
            if (kemoCountElement) kemoCountElement.textContent = 0;
            return;
        }
        
        // Calculate total counts
        let tarikTotal = 0;
        let kemoTotal = 0;
        
        entries.forEach(entry => {
            if (entry.name === 'Tarik') tarikTotal++;
            else kemoTotal++;
        });
        
        // Update the count displays
        if (tarikCountElement) tarikCountElement.textContent = tarikTotal;
        if (kemoCountElement) kemoCountElement.textContent = kemoTotal;
        
        // Determine who's next based on total balance
        let nextPerson;
        if (tarikTotal > kemoTotal) {
            nextPerson = 'Kemo';
        } else if (kemoTotal > tarikTotal) {
            nextPerson = 'Tarik';
        } else {
            // If equal, alternate from last person
            nextPerson = entries[0].name === 'Tarik' ? 'Kemo' : 'Tarik';
        }
        
        nextPersonElement.textContent = nextPerson;
        nextPersonElement.className = `next-person ${nextPerson.toLowerCase()}`; // This is correct
    }, (error) => {
        console.error(`Error fetching entries for ${chore}:`, error);
        nextPersonElement.textContent = "Error loading data";
        if (tarikCountElement) tarikCountElement.textContent = '-';
        if (kemoCountElement) kemoCountElement.textContent = '-';
    });
}

// Display entries when page loads
window.onload = function() {
    console.log('Page loaded, pathname:', window.location.pathname);
    // Get the current page filename
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    console.log('Current page name:', pageName);
    
    // Check if we're on a specific chore page using a more robust method
    if (pageName === 'dishwasher.html' || pageName.includes('dishwasher') || currentPath.endsWith('/dishwasher.html')) {
        console.log('On dishwasher page, loading mašina data');
        determineNextPerson('mašina');
        displayChoreHistory('mašina');
    } else if (pageName === 'grocery.html' || pageName.includes('grocery') || currentPath.endsWith('/grocery.html')) {
        console.log('On grocery page, loading granap data');
        determineNextPerson('granap');
        displayChoreHistory('granap');
    } else {
        // We're on the home page or index.html
        console.log('On home page, loading all entries');
        displayEntries();
    }
};

function displayEntries() {
    const historyList = document.getElementById('historyList');
    if (!historyList) {
        console.error('History list element not found');
        return;
    }
    
    historyList.innerHTML = '<div class="loading">Loading...</div>';
    console.log('Fetching recent entries for home page');
    
    // Changed from limitToLast(10) to limitToLast(5)
    database.ref('entries').orderByChild('timestamp').limitToLast(5).on('value', (snapshot) => {
        console.log('Received home page snapshot:', snapshot.val());
        const entries = [];
        snapshot.forEach((childSnapshot) => {
            entries.unshift(childSnapshot.val());
        });
        
        if (entries.length === 0) {
            historyList.innerHTML = '<div class="no-entries">No entries yet</div>';
            return;
        }
        
        historyList.innerHTML = entries.map(entry => `
            <div class="entry">
                <span class="${entry.name.toLowerCase()}">${entry.name} - ${entry.chore}</span>
                <span>${entry.date}</span>
            </div>
        `).join('');
    }, (error) => {
        console.error('Error fetching entries for home page:', error);
        historyList.innerHTML = '<div class="no-entries">Error loading entries</div>';
    });
}

function displayChoreHistory(chore) {
    const historyList = document.getElementById('choreHistory');
    if (!historyList) return;
    
    historyList.innerHTML = '<div class="loading">Loading...</div>';
    
    database.ref('entries').orderByChild('chore').equalTo(chore).on('value', (snapshot) => {
        const entries = [];
        snapshot.forEach((childSnapshot) => {
            entries.push(childSnapshot.val());
        });
        
        // Sort by timestamp (newest first)
        entries.sort((a, b) => b.timestamp - a.timestamp);
        
        if (entries.length === 0) {
            historyList.innerHTML = '<div class="no-entries">No entries yet</div>';
            return;
        }
        
        historyList.innerHTML = entries.map(entry => `
            <div class="entry">
                <span class="${entry.name.toLowerCase()}">${entry.name}</span>
                <span>${entry.date}</span>
            </div>
        `).join('');
    }, (error) => {
        console.error("Error fetching chore history:", error);
        historyList.innerHTML = '<div class="no-entries">Error loading history</div>';
    });
}