"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

const fileIo = {};

fileIo.offerFileToClient = function (filename, data, type = "text/plain")
{
	let anchorNode = document.createElement("a");
	anchorNode.style.display = "none";
	let file = new Blob([data], {"type": type});
	anchorNode.href = URL.createObjectURL(file);
	anchorNode.download = String(filename).replace(/[^a-z0-9\s\-_.]/ig, "");
	document.body.appendChild(anchorNode);
	anchorNode.click();
	anchorNode.remove();
}

fileIo.requestClientFile = function (clickEvent)
{
	return new Promise((resolve, reject) =>
	{
		let inputNode = document.createElement("input");
		inputNode.setAttribute("type", "file");
		inputNode.setAttribute("accept", "text/plain");
		inputNode.style.display = "none";
		inputNode.onchange = (fileEvent) =>
		{
			let fileReader = new FileReader();
			fileReader.onload = (evt) => resolve(evt);
			fileReader.readAsText(fileEvent.target.files[0]);
		};
		document.body.appendChild(inputNode);
		inputNode.click();
		inputNode.remove();
	});
}

fileIo.fetchServerFile = function (url, autoRecognizeDataType = true)
{
	return new Promise((resolve, reject) =>
	{
		let httpRequest = new XMLHttpRequest();
		httpRequest.open("GET", url);
		httpRequest.onloadend = (httpEvent) =>
		{
			let result = httpEvent.target.responseText;
			if (httpEvent.target.status !== 200)
			{
				reject(new ReferenceError("Getting \"" + url + "\" returned HTTP status code " + httpEvent.target.status));
			}
			else
			{
				if (autoRecognizeDataType)
				{
					try
					{
						let fileExt = /\.([^.]+)$/.exec(url.toLowerCase());
						if (!!fileExt)
						{
							switch (fileExt[1])
							{
							case "json":
								result = JSON.parse(result);
								break;
							case "xml":
								result = new DOMParser().parseFromString(result, "text/xml");
								break;
							}
						}
					}
					catch (ex)
					{
						reject(new SyntaxError(ex.message));
					}
				}
			}
			resolve(result);
		}
		httpRequest.send();
	});
}
