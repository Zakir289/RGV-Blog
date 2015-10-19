var fs        = require('fs')
,   sys       = require('util')
,   path      = require('path')
,   md2html   = require('marked')
,   highlight  = require('highlight.js')
,   postsPath = path.join(__dirname, '../posts')
,   sorter    = function(a,b) { return b.substr(0,10).replace(/-/g,'') - a.substr(0,10).replace(/-/g,'') }

md2html.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    highlight: function(code, lang) {
        if (lang)
            return highlight.highlight(lang, code).value;
        else
            return highlight.highlightAuto(code).value;
    }
});

var Post = function (filename) { this.filename = filename }

Post.all = function (files) {
    return files.map(function(f) {
        return new Post(f);
    });
};

Post.page = function (page) {
    var self = this
    ,   files = fs.readdirSync(postsPath).sort(sorter)
    ,   posts = Post.all(files)
    ,   count = 5
    ,   max   = Math.ceil(posts.length/count)
    ,   cur   = ~~page || 1
    ,   next  = cur + 1
    ,   prev  = cur - 1
    ,   start = cur == 1 ? 0 : prev*count
    ,   end   = start >= count ? start+count : count;
    return {
        posts:    posts.slice(start, end)
    ,   page:     cur
    ,   max:      max
    ,   nextPage: next
    ,   prevPage: prev
    }
};

// FIXME - this whole method is an embarassing gross. wtf!
Post.rss = function () {
    var title   = 'devblog'
    ,   desc    = 'devblog.me - Slava\'s dev blog'
    ,   domain  = 'http://devblog.me'
    ,   htmlesc = function(str){ return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    s = '<rss version="2.0">';
    s += '<channel>';
    s += '<description>' + htmlesc(desc) + '</description>';
    s += '<title>' + htmlesc(title) + '</title>';
    s += '<generator>https://github.com/imslavko/devblog</generator>';
    s += '<link>' + htmlesc(domain) + '/</link>';
    var posts = Post.all(fs.readdirSync(postsPath).sort(sorter));
    for (var i = 0; i < Math.min(5, posts.length); i++) {
        s += '<item>';
        s += '<title>' + htmlesc(posts[i].title()) + '</title>';
        s += '<description>' + htmlesc(posts[i].html()) + '</description>';
        s += '<link>' + htmlesc(domain + posts[i].url()) + '</link>';
        s += '<guid>' + htmlesc(domain + posts[i].url()) + '</guid>';
        s += '<pubDate>' + htmlesc(posts[i].created().toUTCString()) + '</pubDate>';
        s += '</item>';
    }
    s += '</channel></rss>';
    return s.replace(/&nbsp;/g, '&#160;'); // oh the irony! fixes webkit bug w/ &nbsp; in xml documents
};

Post.prototype = {

    created: function() {
        var e = this.filename.split('-').slice(0,3)
        ,   y = e[0]
        ,   m = e[1] - 1 //wtfdate!
        ,   d = e[2]
        ,   c = new Date(y, m, d);
        return c;
    },
    title: function() {
        var a = this.filename.split('-')
        ,   l = a.length
        ,   t = a.slice(3,l).join(' ').replace('.md','');
        return t;
    },
    url: function() {
        var everything = this.filename.replace('.md','').split('-')
        ,   length = everything.length
        ,   theDate = everything.slice(0,3).join('/')
        ,   article = everything.slice(3,length).join('-');
        return '/' + theDate  + '/' + article;
    },
    anchor: function() {
        return '<a href="' + this.url() + '">' + this.title() + '</a>';
    },
    html: function() {
        // read in the post text
        var p = path.join(__dirname, "../posts", this.filename)
        ,   t = fs.readFileSync(p).toString();

        // return markdown to html
        return md2html(t);
    },
    desc: function() {
        // read in the post text
        var p = path.join(__dirname, "../posts", this.filename)
        ,   t = fs.readFileSync(p).toString();

        // return markdown to html
        return md2html(t.split('\n\n')[0]);
    }
};

exports.Post = Post;
