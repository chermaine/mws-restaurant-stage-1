var staticCacheName = 'restaurant-review-v1';
var contentImgsCache = 'restaurant-review-imgs';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'js/main.js',
        'css/styles.css',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'data/restaurants.json'
      ]);
    })
  );
});

self.addEventListener('fetch', function (event) { 
  var requestUrl = new URL(event.request.url);

  if(event.request.url.includes('restaurant.html?id=')){ const strippedurl = event.request.url.split('?')[0];
    event.respondWith(
      caches.match(strippedurl).then(function(response){
        return response || fetch(event.response);
      })
    );
    return;
  }
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }
    
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(response){
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        if (networkResponse.status === 404) {
          return;
        }
        return caches.open(staticCacheName).then(cache => {
          cache.put(event.request.url, networkResponse.clone());
          return networkResponse;
        })
      })
    }).catch(error => {
      console.log('Error: ', error);
      return;
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
})