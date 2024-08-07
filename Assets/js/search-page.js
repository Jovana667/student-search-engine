const searchFormEl = document.querySelector('#search-form');
const deleteModal = document.querySelector('#delete-modal');
const closeModalBtn = document.querySelector('#close-modal');
const confirmDeleteBtn = document.querySelector('#confirm-delete');
const cancelDeleteBtn = document.querySelector('#cancel-delete');
const showHistoryBtn = document.querySelector('#show-history');
const searchHistoryContainer = document.querySelector('#search-history');
const nextPageBtn = document.getElementById('next-page');
const lastPageBtn = document.getElementById('last-page');
const resultsPerPage = 5;

let searchHistoryList = JSON.parse(localStorage.getItem('search-history-list')) || [];
let currentDeleteIndex = null;
let isHistoryVisible = false;
let currentPage = 1;
let lastQuery = '';
let lastSource = '';
let pageTokens = [''];

function getParams() {
  const searchParamsArr = document.location.search.split('&');

  const query = searchParamsArr[0].split('=').pop();
  const source = searchParamsArr[1].split('=').pop();

  lastQuery = query;
  lastSource = source;
  currentPage = 1;
  pageTokens = [''];

  if (source === 'wikipedia') {
    searchWikipedia(query, 0);
  } else {
    searchYoutube(query);
  }
}

function searchWikipedia(query, offset = 0) {
  let apiUrlWikipedia = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json&origin=*&srlimit=${resultsPerPage}&sroffset=${offset}`;

  fetch(apiUrlWikipedia)
      .then(response => response.json())
      .then(data => {
          let articlesContainer = document.getElementById('articles');
          articlesContainer.innerHTML = '';
          data.query.search.forEach(item => {
              let articleDiv = document.createElement('div');
              articleDiv.classList.add('article');

              let title = document.createElement('h3');
              title.textContent = item.title;
              articleDiv.appendChild(title);

              let snippet = document.createElement('p');
              snippet.innerHTML = item.snippet + '...';
              articleDiv.appendChild(snippet);

              let readMoreLink = document.createElement('a');
              readMoreLink.href = `https://en.wikipedia.org/?curid=${item.pageid}`;
              readMoreLink.textContent = 'Read more';
              readMoreLink.target = '_blank';
              articleDiv.appendChild(readMoreLink);

              articlesContainer.appendChild(articleDiv);
          });
          
          updatePaginationButtons('wikipedia', offset, data.query.searchinfo.totalhits);
      })
      .catch(error => console.error('Error fetching data:', error));
}

function searchYoutube(query, pageToken = '') {
  let apiKey = 'AIzaSyCWiyD0PtzL7ZgFu3h5f261HZQ9x7ypy84';
  let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${query}&key=${apiKey}&maxResults=${resultsPerPage}`;
  
  if (pageToken) {
    apiUrl += `&pageToken=${pageToken}`;
  }

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      let videosContainer = document.getElementById('videos');
      videosContainer.innerHTML = '';
      data.items.forEach(item => {
        let videoId = item.id.videoId;
        let iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        videosContainer.appendChild(iframe);
      });

      updatePaginationButtons('youtube', pageToken, data.pageInfo.totalResults, data.nextPageToken);
    })
    .catch(error => console.error('Error fetching data:', error));
}

function handleSearchFormSubmit(event) {
  event.preventDefault();

  const searchInputVal = document.querySelector('#search-input').value;
  const youtubeRadio = document.querySelector('#radioYouTube');
  const wikipediaRadio = document.querySelector('#radioWikipedia');

  if (!searchInputVal) {
    alert('You need a search input value!');
    return;
  }

  let selectedSource;
  if (youtubeRadio.checked) {
    selectedSource = youtubeRadio.value;
  } else if (wikipediaRadio.checked) {
    selectedSource = wikipediaRadio.value;
  } else {
    alert('Please choose a source website that you want to search from!'); 
    return;
  }

  const searchEntry = { query: searchInputVal, source: selectedSource };
  const isDuplicate = searchHistoryList.some(
    history => history.query === searchEntry.query && history.source === searchEntry.source
  );

  if (!isDuplicate) {
    searchHistoryList.push(searchEntry);
    if (searchHistoryList.length > 10) {
      searchHistoryList = searchHistoryList.slice(-10);
    }
    localStorage.setItem('search-history-list', JSON.stringify(searchHistoryList));
  }

  currentPage = 1;
  const queryString = `./search.html?q=${searchInputVal}&source=${selectedSource}`;

  location.assign(queryString);
}

function renderSearchHistoryList() {
  searchHistoryContainer.innerHTML = '';

  searchHistoryList.slice(-10).reverse().forEach((searchHistory, index) => {
    const historyButton = document.createElement('button');
    historyButton.classList.add('btn', 'btn-info', 'btn-block', 'mb-2', 'd-flex', 'align-items-center', 'justify-content-between');
    historyButton.innerHTML = `${searchHistory.query} (${searchHistory.source})`;

    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash', 'text-danger', 'ms-2');
    deleteIcon.addEventListener('click', (event) => {
      event.stopPropagation(); 
      currentDeleteIndex = searchHistoryList.length - 1 - index;
      openModal();
    });

    historyButton.appendChild(deleteIcon);

    historyButton.addEventListener('click', () => {
      const searchQuery = searchHistory.query;
      const searchSource = searchHistory.source;
      const queryString = `https://jovana667.github.io/student-search-engine/search.html?q=${searchQuery}&source=${searchSource}`;
      location.assign(queryString);

      searchHistoryList = searchHistoryList.filter(
        history => !(history.query === searchHistory.query && history.source === searchHistory.source)
      );

      searchHistoryList.push(searchHistory);
      if (searchHistoryList.length > 10) {
        searchHistoryList = searchHistoryList.slice(-10);
      }
      localStorage.setItem('search-history-list', JSON.stringify(searchHistoryList));
      renderSearchHistoryList();
    });

    searchHistoryContainer.appendChild(historyButton);
  });
}

function openModal() {
  deleteModal.classList.add('is-active');
}

function closeModal() {
  deleteModal.classList.remove('is-active');
}

function toggleSearchHistory() {
  isHistoryVisible = !isHistoryVisible;
  searchHistoryContainer.style.display = isHistoryVisible ? 'block' : 'none';
  showHistoryBtn.textContent = isHistoryVisible ? 'Hide' : 'Show';
}

function updatePaginationButtons(source, currentPage, totalResults, nextPageToken = null) {
  const isFirstPage = source === 'wikipedia' ? currentPage === 0 : pageTokens.length === 1;
  const isLastPage = source === 'wikipedia' 
    ? (currentPage + resultsPerPage) >= totalResults 
    : !nextPageToken;

  lastPageBtn.disabled = isFirstPage;
  nextPageBtn.disabled = isLastPage;
  
  // Always show the buttons, but disable them when necessary
  lastPageBtn.style.display = 'inline-block';
  nextPageBtn.style.display = 'inline-block';
  
  if (source === 'youtube' && nextPageToken && !pageTokens.includes(nextPageToken)) {
    pageTokens.push(nextPageToken);
  }
}

searchFormEl.addEventListener('submit', handleSearchFormSubmit);

closeModalBtn.addEventListener('click', closeModal);
cancelDeleteBtn.addEventListener('click', closeModal);
confirmDeleteBtn.addEventListener('click', () => {
  if (currentDeleteIndex !== null) {
    searchHistoryList.splice(currentDeleteIndex, 1);
    localStorage.setItem('search-history-list', JSON.stringify(searchHistoryList));
    renderSearchHistoryList();
    currentDeleteIndex = null;
  }
  closeModal();
});

showHistoryBtn.addEventListener('click', toggleSearchHistory);

nextPageBtn.addEventListener('click', () => {
  if (lastSource === 'youtube') {
    const nextPageToken = pageTokens[pageTokens.length - 1];
    searchYoutube(lastQuery, nextPageToken);
  } else if (lastSource === 'wikipedia') {
    const nextOffset = currentPage * resultsPerPage;
    searchWikipedia(lastQuery, nextOffset);
  }
  currentPage++;
});

lastPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    if (lastSource === 'wikipedia') {
      const prevOffset = (currentPage - 1) * resultsPerPage;
      searchWikipedia(lastQuery, prevOffset);
    } else if (lastSource === 'youtube') {
      const prevPageToken = pageTokens[pageTokens.length - 2];
      pageTokens.pop();
      searchYoutube(lastQuery, prevPageToken);
    }
  }
});

window.addEventListener('load', () => {
  const storedHistory = localStorage.getItem('search-history-list');
  if (storedHistory) {
    searchHistoryList = JSON.parse(storedHistory);
    renderSearchHistoryList();
  }
  searchHistoryContainer.style.display = 'none';

  // Initialize pagination buttons
  lastPageBtn.style.display = 'inline-block';
  nextPageBtn.style.display = 'inline-block';
  lastPageBtn.disabled = true;
  nextPageBtn.disabled = false;

  getParams();
});

window.addEventListener('click', (event) => {
  if (event.target === deleteModal) {
    closeModal();
  }
});