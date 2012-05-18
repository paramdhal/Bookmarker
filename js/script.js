$().ready(function(){
	$('#bookmarks').bookMarker({
		title: ['#customTitle','h1'],
		description: ['#customDesc','meta[name="description"]'],
		addedBookmark: function(bookmark){console.log('Bookark '+bookmark.title+' added!')},
		removedBookmark: function(bookmark){console.log('Bookark '+bookmark.title+' removed!')},
		cookieDisabled: function(){console.log('Cookies are disabled!')},
		maxBookmarks: 4,
		bmkHTML: function(title,desc,url,category){return '<a href="'+url+'" class="'+category+'"><span class="bookMarkTitle">'+title+'</span></a><div>'+desc+'<a class="removeBookmark" href="#">Remove bookmark</a></div>';},
		maxDesc:20
	});
});

(function($)
{
	var defaultSettings = {
		addBookmarkSelector	: '.addBookmark',  					// jquery selector for add bookmark button
		title 				: ['title','h1'],					// array of jquery selectors to be used for the title
		description			: ['meta[name="description"]'],		// array of jquery selectors to be used for the description
		addedBookmark		: null,								// event for when a bookmark is added
		removedBookmark		: null,								// event for when a bookmark is removed
		cookieDisabled		: null,								// event for cookies disabled
		maxBookmarks		: 10,								// Maximum number of bookmarks
		maxDesc				: null,								// Maximum characters for description
		maxTitle			: null,								// Maximum characters for title
		bmkHTML				: function(title,desc,url,category){return '<a href="'+url+'" class="bmkLink '+category+'"><span class="bookMarkTitle">'+title+'</span><span class="bookMarkDesc">'+desc+'</span></a><a class="removeBookmark" href="#">Remove bookmark</a>';}	
	};
	
	$.fn.bookMarker = function(settings)
	
	{
		settings = $.extend({}, defaultSettings, settings || {});
		
		return this.each(function()
		{
			var elem = $(this);	
			var bm = new BookMarker(settings,elem);
			if(cookiesEnabled()){
				bm.getBookmarks();
				bm.clickEvents();
			}else{
				if(settings.cookieDisabled) settings.cookieDisabled();
			}
		});
	};
	
	function BookMarker(settings,elem)
	{ 
		this.settings = settings;
		this.elem = elem;
		this.listOfBookmarks = {};
		return this;
	}
	
	BookMarker.prototype =
	{
		getBookmarks: function (){
			var $this = this;
			$this.listOfBookmarks.localArray=[];
			var JSONData =getJSONData();
			if(JSONData){
				$(JSONData.localArray).each(function(){
					var bookMark = new Bookmark(this.title,this.description,this.url,this.category);
					$this.listOfBookmarks.localArray.push(bookMark);
					var bmkHTML=$this.bookMarkHTML(bookMark);
					$this.elem.find('.bookmarkList').append(bmkHTML);
				});
			}		
		},
		clickEvents: function (){
			var $this = this;
			$($this.settings.addBookmarkSelector).click(function(){
				$this.getBookmarkData(this);
				return false;
			});
			$this.elem.find('.removeBookmark').live('click',function(){
				var bookmark=$(this).parents('.bookMark').data('bookmark');
				$this.checkRemove(bookmark);
				$this.addToStorage();
			});
			$this.elem.find('.removeBookmarks').click(function(){
				$this.removeAll();
				return false;
			});
		},
		getBookmarkData: function(link){
			var settings = this.settings;
			var title=getDataFromLoop(settings.title);
			if(settings.maxTitle){title = limitChar(title,settings.maxTitle);}
			var description = getDataFromLoop(settings.description);
			if(settings.maxDesc){description=limitChar(description,settings.maxDesc);}
			var url = window.location.pathname;
			var category = $(link).attr('rel');
			category = category ? category : 'generic';
			var bookmark = new Bookmark(title,description,url,category);
			this.checkInList(bookmark);
		},
		checkInList: function(bookmark){
			var array =this.listOfBookmarks.localArray;
	
			if(array.length===0){this.addBookmark(bookmark);}
			if(array.length>0 && array[0].url !== bookmark.url){
				this.checkRemove(bookmark);
				this.addBookmark(bookmark);
			}
		},
		addBookmark: function(bookmark){
			var array = this.listOfBookmarks.localArray;
			array.unshift(bookmark);
			var html =this.bookMarkHTML(bookmark);
			$(html).hide().prependTo(this.elem.find('.bookmarkList')).fadeIn();
			if(array.length > this.settings.maxBookmarks){this.removeBookmark(array.length-1,bookmark);}
			this.addToStorage();
			if(this.settings.addedBookmark) this.settings.addedBookmark(bookmark);
		},
		addToStorage: function(){
			localStorage.setItem('bookmarks',JSON.stringify(this.listOfBookmarks));
		},
		removeBookmark: function(i,bookmark){
			this.listOfBookmarks.localArray.splice(i,1);
			this.elem.find('.bookMark:eq('+i+')').remove();
			if(this.settings.removedBookmark) this.settings.removedBookmark(bookmark);
		},
		removeAll: function(){
			localStorage.removeItem('bookmarks');
			this.elem.find('.bookmarkList').empty();
			this.listOfBookmarks.localArray=[];
		},
		checkRemove: function(bookmark){
			var array =this.listOfBookmarks.localArray;
			for(var i =0;i<array.length;i++){
				if(array[i].url === bookmark.url){
					this.removeBookmark(i,bookmark);
				}
			}
		},bookMarkHTML: function(bookmark){
			var $this = this;
			var div = $("<div></div>", {
					data: {
						bookmark: bookmark
					},
					'class': 'bookMark'
				});
			var getHtml = $this.settings.bmkHTML;
			var html = getHtml(bookmark.title,bookmark.description,bookmark.url,bookmark.category);
			return div.html(html);
		}
	};
	
	var getJSONData = function(){
		if(localStorage.getItem('bookmarks')){
			return $.parseJSON(localStorage.getItem('bookmarks'));
		}
		return null;
	};
	
	var limitChar = function(string,count){
		return string.length>count ? string.slice(0,count) +'...' : string;
	}
	
	var getDataFromLoop = function(array){
		var title='';
		for(i=0;i<array.length;i++){
			var t = array[i].indexOf('meta') === 0 ? $(array[i]).attr('content') : $(array[i]).text();
			if(t.length>0){title = t;break;}
		}
		return title;
	};
	
	var cookiesEnabled = function () { 
		var id = new Date().getTime();
		document.cookie = '__cookieprobe=' + id + ';path=/';
		return (document.cookie.indexOf(id) !== -1); 
	};
	
	function Bookmark(title,description,url,category) {
   		this.title = title;
   		this.description = description;
   		this.url = url;
   		this.category = category;
	};
	
	
})(jQuery);