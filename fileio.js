"use strict";

/*
Copyright 2021 Christoph Zager - https://github.com/Suppenhuhn79/vanilla-tools
Licensed under the Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 */

var fileIo = {};

fileIo.offerFileToClient = function (filename, data)
{
	let anchorNode = document.createElement("a");
	anchorNode.style.display = "none";
	let file = new Blob([data],
	{
		type: "text/plain"
	}
		);
	anchorNode.href = URL.createObjectURL(file);
	anchorNode.download = String(filename).replace(/[^a-z0-9\s\-_.]/ig, "");
	document.body.appendChild(anchorNode);
	anchorNode.click();
	anchorNode.remove();
};

fileIo.requestClientFile = function (clickEvent, callback)
{
	let inputNode = document.createElement("input");
	inputNode.setAttribute("type", "file");
	inputNode.setAttribute("accept", "text/plain");
	inputNode.style.display = "none";
	inputNode.onchange = function (fileEvent)
	{
		let fileReader = new FileReader();
		fileReader.onload = callback;
		fileReader.readAsText(fileEvent.target.files[0]);
	};
	document.body.appendChild(inputNode);
	inputNode.click();
	inputNode.remove();
};

fileIo.fetchServerFile = function (url, callback, autoRecognizeDataType = true)
{
	let httpRequest = new XMLHttpRequest();
	httpRequest.open("GET", url);
	httpRequest.onloadend = function (httpEvent)
	{
		let result = httpEvent.target.responseText;
		let error = null;
		if (httpEvent.target.status !== 200)
		{
			error = new ReferenceError("Getting \"" + url + "\" returned HTTP status code " + httpEvent.target.status);
		}
		else
		{
			if (autoRecognizeDataType === true)
			{
				try
				{
					let fileExt = /\.([^.]+)$/.exec(url.toLowerCase());
					if (fileExt !== null)
					{
						switch (fileExt[1])
						{
						case "json":
							result = JSON.parse(result);
							break;
						case "xml":
							result = new DOMParser().parseFromString(result, "text/xml");
							break;
						};
					};
				}
				catch (ex)
				{
					error = new SyntaxError(ex.message);
				}
			};
		};
		callback(url, result, error);
	};
	httpRequest.send();
};
