"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var editor = null;
var data = {
  source: {
    model: null,
    state: null
  },
  dom: {
    model: null,
    state: null
  },
  component: {
    model: null,
    state: null
  },
  app: {
    model: null,
    state: null
  },
  html: {
    model: null,
    state: null
  }
};
function changeTab(editor, desiredModelId) {
  var currentState = editor.saveViewState();
  var currentModel = editor.getModel();

  for (var key in data) {
    if (currentModel === data[key].model) {
      data[key].state = currentState;
    }
  }

  editor.setModel(data[desiredModelId].model);
  editor.restoreViewState(data[desiredModelId].state);
  editor.focus();
}

$("#edittab > li").on("click", function (event) {
  changeTab(editor, $(this).attr("id"));
});

function changeSrc(url, cb) {
    if(!url){
      var doc = localDraft();
      if (doc){
        data.source.model.setValue(localDraft());
        $("#child-frame").attr("srcdoc", "");
        //$("#child-frame").attr("src", "./blank.html");
        if (cb) return cb();
      }else{
        url = $("#test5").attr("data-url");
      }
    }
    $.ajax({
      url: url,
      dataType: "html"
    }).done(function (d) {
      //editor.setValue(d);
      data.source.model.setValue(d);
      $("#child-frame").attr("srcdoc", "");
      //$("#child-frame").attr("src", "./blank.html");
      if (cb) return cb();
    });
}
$(".samples").on("click", function (event) {
  changeSrc($(this).attr("data-url"));
});


function saveDraft(source) {
  // ローカルストレージに最新の状態を保存
  localStorage.setItem('draft', JSON.stringify(source));
  console.log("draft:" + JSON.stringify(source));
}
function localDraft() {
  // ページが読み込まれたら、ローカルストレージから状態を読み込む
  var source = JSON.parse(localStorage.getItem('draft')) || null;
  console.log("source:" + JSON.stringify(source));
  return source;
}

var htmlparser = Tautologistics.NodeHtmlParser;

var parseHtml = function parseHtml(rawHtml) {
  return htmlparser.parseDOM(rawHtml, {
    enforceEmptyTags: true,
    ignoreWhitespace: true,
    caseSensitiveTags: true,
    caseSensitiveAttr: true,
    verbose: false
  });
};

var DebugBuilder = function (_Builder) {
  _inherits(DebugBuilder, _Builder);

  function DebugBuilder() {
    _classCallCheck(this, DebugBuilder);

    return _possibleConstructorReturn(this, _Builder.apply(this, arguments));
  }

  DebugBuilder.prototype.beforeCompile = function beforeCompile(src) {
    console.log("DebugBuilder", stringify(src));
  };

  DebugBuilder.prototype.beforeCreateNodes = function beforeCreateNodes(src) {
    console.log("DebugBuilder-createNodes", stringify(src));
  };

  DebugBuilder.prototype.beforeCreateTagElement = function beforeCreateTagElement(src) {
    console.log("DebugBuilder-beforeCreateTagElement", stringify(src));
  };

  return DebugBuilder;
}(Builder);

var arg = new Object();
var pair = location.search.substring(1).split('&');
for (var i = 0; pair[i]; i++) {
  var kv = pair[i].split('=');
  arg[kv[0]] = kv[1];
}


var editorContainer = document.getElementById("container");

//View///////////////////////////////////////////////////
$(function () {
  require.config({
    paths: {
      vs: "//microsoft.github.io/monaco-editor/node_modules/monaco-editor/min/vs"
    }
  });
  require(["vs/editor/editor.main"], function () {
    data.source.model = monaco.editor.createModel("", "html");
    data.dom.model = monaco.editor.createModel("", "json");
    data.component.model = monaco.editor.createModel("", "javascript");
    data.app.model = monaco.editor.createModel("", "javascript");
    data.html.model = monaco.editor.createModel("html", "html");

    editor = monaco.editor.create(editorContainer, {
      automaticLayout: true,
      model: data.source.model
    });
    var url = arg["q"] ? arg["q"] : "";
    changeSrc(url, function () {
      compile();
    });
  });

  function compile() {
    saveDraft(data.source.model.getValue());
    var webComponentParser = new WebComponentParser({
      builder: ReactComponentBuilder
    });

    var reactRootParser = new ReactRootComponentBuilder({
      builder: ReactComponentBuilder
    });

    var builder = new HtmlBuilder({});
    var builder2 = new HtmlBuilder({});
    var debugBuilder = new DebugBuilder({});
    var cssbuilder = new CSSBuilder({});
    var reactComponentBuilder = new ReactComponentBuilder({});
    var compiler1 = new Compiler([cssbuilder, webComponentParser, reactRootParser], {});
    var compiler2 = new Compiler([builder], {});
    var compiler3 = new Compiler([builder2], {});

    //-ここからDemo用処理----------------------------------
    var parseData = parseHtml(data.source.model.getValue().trim());
    data.dom.model.setValue(stringify(parseData));
    compiler1.compile(parseData); //jsonオブジェクトを各種コードに変換します

    //editor4.setValue(cssbuilder.getNodes());

    webComponentParser.build(); //react化処理の実行
    //変換されたコードはwindowに読み込まれ実行可能になります。
    reactRootParser.build(); //react化処理の実行
    //変換されたコードはwindowに読み込まれ実行可能になります。
    data.component.model.setValue(webComponentParser.getResult());
    data.app.model.setValue(reactRootParser.getResult());

    var bodyElements = parseData.getElementsByTagName("body");
    if (parseData.getElementsByTagName("head").length == 0) {
      var $html = parseData.getElementsByTagName("html");
      var newElement = $html[0].createElement("head");
      $html[0].insertBefore(newElement, bodyElements[0]);
    }
    var headElements = parseData.getElementsByTagName("head");
    headElements.forEach(function (headElement) {
      //head配下に追加
      var addpoint = headElement.getElementsByTagName("script")[0];
      {
        var newElement = headElement.createElement("script");
        var child = newElement.createTextNode(reactRootParser.getResult());
        newElement.appendChild(child);
        headElement.insertBefore(newElement, addpoint);
        addpoint = newElement;
      }
      {
        var newElement = headElement.createElement("script");
        var child = newElement.createTextNode(webComponentParser.getResult());
        newElement.appendChild(child);
        headElement.insertBefore(newElement, addpoint);
        addpoint = newElement;
      }
      {
        var newElement = headElement.createElement("script");
        newElement.attributes = {
          src: [{
            type: "text",
            data: "https://fb.me/react-dom-15.1.0.js"
          }]
        };
        headElement.insertBefore(newElement, addpoint);
        addpoint = newElement;
      }
      {
        var newElement = headElement.createElement("script");
        newElement.attributes = {
          src: [{
            type: "text",
            data: "https://fb.me/react-15.1.0.js"
          }]
        };
        headElement.insertBefore(newElement, addpoint);
        addpoint = newElement;
      }
      {
        var newElement = headElement.createElement("script");
        newElement.attributes = {
          src: [{
            type: "text",
            data: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js"
          }]
        };
        headElement.insertBefore(newElement, addpoint);
        addpoint = newElement;
      }
    }, this);

    bodyElements.forEach(function (bodyElement) {
      {
        var newElement = bodyElement.createElement("script");
        var child = newElement.createTextNode("\n var render = function render() {\n  ReactDOM.render(\n    React.createElement(App, null),\n    document.querySelector(\"#app\")\n  );\n};\n\n$(function() {\n  render();\n});");
        newElement.appendChild(child);
        bodyElement.appendChild(newElement);
      }
    }, this);
    compiler2.compile(parseData.children); //jsonオブジェクトを各種コードに変換します
    compiler3.compile(bodyElements[0].children); //jsonオブジェクトを各種コードに変換します
    data.html.model.setValue(builder.getNodes());
    // iframe内のコンテンツのdocumentオブジェクト追加
    $("#child-frame").attr("srcdoc", builder.getNodes());

/*
    var iframehead = document.getElementById("child-frame").contentDocument.head;
    {
    var newElement = document.createElement("script");
        newElement.type = "text/javascript";
        newElement.innerHTML  = reactRootParser.getResult();
        iframehead.appendChild(newElement);
    }
    {
    var newElement = document.createElement("script");
        newElement.type = "text/javascript";
        newElement.innerHTML  = webComponentParser.getResult();
        iframehead.appendChild(newElement);
    }
    //document.getElementById("child-frame").contentDocument.body.innerHTML = builder2.getNodes();
*/
//document.getElementById("child-frame").contentDocument.innerHTML = builder.getNodes();

  }

  $("#run").on("click", function (event) {
    compile();
  });


  $(window).keydown(function(e) {
    if(e.keyCode === 120){
        compile();
        return false;
      }
    if(e.ctrlKey){
      if(e.keyCode === 83){
        saveDraft(data.source.model.getValue());
              return false;
      }
    }
  });

});


function stringify(str) {
  var cache = [];
  return JSON.stringify(str, function (key, value) {
    if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    if (key == "parentNode") return;
    return value;
  },
    "\t"
  );
}
