"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

var pageSnippets = {};

pageSnippets.snippets = {};

pageSnippets.import = function (url)
{
	return new Promise((resolve, reject) => fileIo.fetchServerFile(url).then(
		(xmlDocument) =>
		{
			function _cleanPath(path)
			{
				let templateRoot = url.replace(/[^./]+\.[\S]+$/, "");
				let result = templateRoot.concat(path).replace(/[^/]+\/\.\.\//g, "");
				return result;
			};
			function _collectSinppets()
			{
				let snippetCollection = xmlDocument.getElementsByTagName("dht:snippet");
				for (let s = 0, ss = snippetCollection.length; s < ss; s += 1)
				{
					pageSnippets.snippets[snippetCollection[s].getAttribute("name")] = snippetCollection[s].firstElementChild;
					if (snippetCollection[s].childElementCount > 1)
					{
						console.warn("<dht:snippet name=\"" + snippetCollection[s].getAttribute("name") + "\"> must have only one child element.", url);
					};
				};
			};
			function _includeStylesheets()
			{
				let stylesheetsCollection = xmlDocument.getElementsByTagName("dht:stylesheet");
				for (let s = 0, ss = stylesheetsCollection.length; s < ss; s += 1)
				{
					let styleNode = document.createElement("link");
					let src = _cleanPath(stylesheetsCollection[s].getAttribute("src"));
					if (document.querySelector("link[rel=\"stylesheet\"][href=\"" + src + "\"]") === null)
					{
						styleNode.setAttribute("rel", "stylesheet");
						styleNode.setAttribute("href", src);
						document.head.appendChild(styleNode);
					};
				};
			};
			function _includeScripts()
			{
				let scriptsCollection = xmlDocument.getElementsByTagName("dht:script");
				let scriptsToLoad = scriptsCollection.length;
				function __onScriptLoadend(loadEvent)
				{
					if (loadEvent.type === "error")
					{
						console.error(new ReferenceError("Error while loading <script> from source \"" + loadEvent.target.src + "\""));
					};
					if ((scriptsToLoad -= 1) === 0)
					{
						resolve();
					};
				};
				for (let s = 0, ss = scriptsCollection.length; s < ss; s += 1)
				{
					let src = _cleanPath(scriptsCollection[s].getAttribute("src"));
					if (document.querySelector("script[src=\"" + src + "\"]") === null)
					{
						let scriptNode = document.createElement("script");
						scriptNode.setAttribute("src", src);
						scriptNode.addEventListener("load", __onScriptLoadend);
						scriptNode.addEventListener("error", __onScriptLoadend);
						document.head.appendChild(scriptNode);
					}
					else
					{
						scriptsToLoad -= 1;
					};
				};
				if ((scriptsCollection.length === 0) || (scriptsToLoad === 0))
				{
					resolve();
				};
			};
			_collectSinppets();
			_includeStylesheets();
			_includeScripts();
		},
		(arg) => reject(new Error(arg)))
	);
};

pageSnippets.produce = function (snippetName, owner = window, variables = {}
)
{
	const nodeType =
	{
		"element": 1,
		"text": 3
	};
	function _resolveVariables(text, variables)
	{
		let rex = /\{{2}([^\}]+)\}{2}/g;
		let result = text;
		let rexResult = rex.exec(text);
		while (!!rexResult)
		{
			if (variables[rexResult[1]] !== undefined)
			{
				result = result.replace("{{" + rexResult[1] + "}}", variables[rexResult[1]]);
			};
			rexResult = rex.exec(text);
		};
		return result;
	};
	function _addAttributes(node, sourceXml, owner, variables)
	{
		for (let a = 0, aa = sourceXml.attributes.length; a < aa; a += 1)
		{
			let attr = sourceXml.attributes[a];
			let rexMatch = /^dht:(on[\w]+)/.exec(attr.name);
			if (!!rexMatch)
			{
				if (typeof owner[attr.value] === "function")
				{
					node[rexMatch[1]] = owner[attr.value].bind(owner);
				}
				else
				{
					console.error("\"" + attr.value + "\" is not a function of owner object", sourceXml);
				};
			}
			else
			{
				node.setAttribute(attr.name, _resolveVariables(attr.value, variables));
			};
		};
	};
	function _appendNodes(node, sourceXml, owner, variables)
	{
		for (let c = 0, cc = sourceXml.childNodes.length; c < cc; c += 1)
		{
			let xmlNode = sourceXml.childNodes[c];
			switch (xmlNode.nodeType)
			{
			case nodeType.element:
				switch (xmlNode.tagName)
				{
				case "dht:call-function":
					__callFunction(node, xmlNode, owner, variables);
					break;
				case "dht:for-each":
					__forEach(node, xmlNode, owner, variables);
					break;
				case "dht:if":
					__if(node, xmlNode, owner, variables);
					break;
				case "dht:insert-snippet":
					node.appendChild(pageSnippets.produce(_resolveVariables(xmlNode.getAttribute("name"), variables), owner, variables));
					break;
				default:
					let child = document.createElement(xmlNode.tagName);
					_addAttributes(child, xmlNode, owner, variables);
					_appendNodes(child, xmlNode, owner, variables);
					_execPostProduction(child, xmlNode, owner);
					node.appendChild(child);
				};
				break;
			case nodeType.text:
				if (/^\s*$/.test(xmlNode.textContent) === false)
				{
					node.appendChild(document.createTextNode(_resolveVariables(xmlNode.textContent, variables)));
				};
				break;
			};
		};
	};
	function _execPostProduction(refNode, xmlNode, owner)
	{
		let postProductionFunction = xmlNode.getAttribute("dht:postproduction");
		if (!!postProductionFunction)
		{
			if (typeof owner[postProductionFunction] === "function")
			{
				owner[postProductionFunction](refNode);
			}
			else
			{
				console.error("\"" + postProductionFunction + "\" is not a function of owner object", xmlNode, owner);
			};
		};
	};
	function __callFunction(refNode, xmlNode, owner, variables)
	{
		let functionName = xmlNode.getAttribute("name");
		if (!!functionName)
		{
			if (typeof owner[functionName] === "function")
			{
				owner[functionName](refNode);
			}
			else
			{
				console.error("\"" + functionName + "\" is not a function of owner object", xmlNode, owner);
			};
		};
	};
	function __forEach(refNode, xmlNode, owner, variables)
	{
		let listKey = xmlNode.getAttribute("list");
		// console.debug("__forEach()", refNode.outerHTML, xmlNode, xmlNode.firstElementChild, variables[listKey]);
		for (let i = 0, ii = variables[listKey].length; i < ii; i += 1)
		{
			_appendNodes(refNode, xmlNode, owner, variables[listKey][i]);
		};
	};
	function __if(refNode, xmlNode, owner, variables)
	{
		let testExpression = _resolveVariables(xmlNode.getAttribute("test"), variables);
		/* escape string delimiters*/
		let testOperators = /('(.*)')?[\s=!<>]+('(.*)')?/.exec(testExpression);
		for (let r of[2, 4])
		{
			if (!!testOperators[r])
			{
				testExpression = testExpression.replace(testOperators[r], testOperators[r].replace("'", "\\"));
			};
		};
		try
		{
			if (eval(testExpression) === true)
			{
				let thenNode = xmlNode.getElementsByTagName("dht:then")[0];
				_appendNodes(refNode, thenNode, owner, variables);
			}
			else
			{
				let elseNode = xmlNode.getElementsByTagName("dht:else");
				if (elseNode.length === 1)
				{
					_appendNodes(refNode, elseNode[0], owner, variables);
				};
			};
		}
		catch (ex)
		{
			throw new EvalError("Cannot evaluate expression \"" + testExpression + "\", " + ex.message);
		};
	};
	if (pageSnippets.snippets[snippetName] === undefined)
	{
		throw new ReferenceError("Unknown snippet \"" + snippetName + "\".");
	}
	else
	{
		let snippet = pageSnippets.snippets[snippetName];
		let result = document.createElement(snippet.tagName);
		// console.debug("pageSnippets.produce", snippetName);
		// console.group(snippetName);
		// console.log(snippet.outerHTML);
		_addAttributes(result, snippet, owner, variables);
		_appendNodes(result, snippet, owner, variables);
		_execPostProduction(result, snippet, owner);
		// console.log(result.outerHTML);
		// console.groupEnd();
		return result;
	};
};
