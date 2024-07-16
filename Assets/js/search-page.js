const resultTextEl = document.querySelector('#result-text');
const resultContentEl = document.querySelector('#result-content');
const searchFormEl = document.querySelector('#search-form');
const searchHistoryEl = document.querySelector('#search-history');

let searchHistoryList = JSON.parse(localStorage.getItem('search-history-list')) || [];

function getParams() {
  const searchParamsArr = document.location.search.split('&');

  const query = searchParamsArr[0].split('=').pop();
  const source = searchParamsArr[1].split('=').pop();

  if (source === 'wikipedia') {
    searchWikipedia(query)
  } else {
    searchYoutube(query)
  }

}

function searchWikipedia(query) {
  let apiUrlWikipedia = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json&origin=*`;

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
              snippet.innerHTML = item.snippet + '...'; // Using innerHTML to render the HTML entities correctly
              articleDiv.appendChild(snippet);

              let readMoreLink = document.createElement('a');
              readMoreLink.href = `https://en.wikipedia.org/?curid=${item.pageid}`;
              readMoreLink.textContent = 'Read more';
              readMoreLink.target = '_blank'; // Opens link in a new tab
              articleDiv.appendChild(readMoreLink);

              articlesContainer.appendChild(articleDiv);
          });
      })
      .catch(error => console.error('Error fetching data:', error));
}

function searchYoutube(query) {
  let apiKey = 'AIzaSyBgjhM8jkAtnDveHMpE2IY0O5MGTioGeMs';
  let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${query}&key=${apiKey}`;

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
      })
      .catch(error => console.error('Error fetching data:', error));
}

function printResults(resultObj) {
  
  
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
    localStorage.setItem('search-history-list', JSON.stringify(searchHistoryList));
  }

  const queryString = `./search.html?q=${searchInputVal}&source=${selectedSource}`;

  location.assign(queryString);
}

function renderSearchHistoryList() {
  searchHistoryEl.innerHTML = '';

  searchHistoryList.forEach((searchHistory, index) => {
    const historyButton = document.createElement('button');
    historyButton.classList.add('btn', 'btn-info', 'btn-block', 'mb-2', 'd-flex', 'align-items-center', 'justify-content-between');
    historyButton.innerHTML = `${searchHistory.query} (${searchHistory.source})`;

    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash', 'text-danger', 'ms-2');
    deleteIcon.addEventListener('click', (event) => {
      event.stopPropagation(); 
      searchHistoryList.splice(index, 1);
      localStorage.setItem('search-history-list', JSON.stringify(searchHistoryList));
      renderSearchHistoryList();
    });

    historyButton.appendChild(deleteIcon);

    historyButton.addEventListener('click', () => {
      document.querySelector('#search-input').value = searchHistory.query;
      if (searchHistory.source === 'youtube') {
        document.querySelector('#radioYouTube').checked = true;
      } else if (searchHistory.source === 'wikipedia') {
        document.querySelector('#radioWikipedia').checked = true;
      }
    });

    searchHistoryEl.appendChild(historyButton);
  });
}

window.addEventListener('load', () => {
  const storedHistory = localStorage.getItem('search-history-list');
  if (storedHistory) {
    searchHistoryList = JSON.parse(storedHistory);
    renderSearchHistoryList();
  }
});

searchFormEl.addEventListener('submit', handleSearchFormSubmit);
getParams();

