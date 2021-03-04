"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

let htmlBuilder = {};

htmlBuilder.adjust = function (element, anchorElement, adjustment = "below bottom, start left")
{
	/* initial position: "start left, top below" */
	let anchorRect = anchorElement.getBoundingClientRect();
	let position = {};
	let elementPositionIsFixed = (window.getComputedStyle(element).position === "fixed");
	/* horizontal adjustment */
	position["x"] = (!!/\bright\b/i.exec(adjustment)) ? anchorRect.right : anchorRect.left;
	position.x -= (!!/\bend\b/i.exec(adjustment)) ? element.offsetWidth : 0;
	position.x += (!!/\bcenter\b/i.exec(adjustment)) ? ((anchorRect.width - element.offsetWidth) / 2) : 0;
	/* vertical adjustment */
	position["y"] = (!!/\bbottom\b/i.exec(adjustment)) ? anchorRect.bottom : anchorRect.top;
	position.y -= (!!/\babove\b/i.exec(adjustment)) ? element.offsetHeight : 0;
	position.y += (!!/\bmiddle\b/i.exec(adjustment)) ? ((anchorRect.height - element.offsetHeight) / 2) : 0;
	/* prevent exceeding the docment client area */
	/* document.body.clientWidth for x, because window.innerWidth does not exclude a scrollbar; we expect a document not be wider than the window */
	let exceedings = {};
	exceedings["x"] = ((elementPositionIsFixed) ? document.body.clientWidth : document.documentElement.offsetWidth) - position.x - element.offsetWidth;
	exceedings["y"] = ((elementPositionIsFixed) ? window.innerHeight : document.documentElement.offsetHeight) - position.y - element.offsetHeight;
	position.x += Math.min(exceedings.x, 0);
	position.y += Math.min(exceedings.y, 0);
	/* prevent positions < 0 */
	position.y = Math.max(position.y, 0);
	position.x = Math.max(position.x, 0);
	/* rescpect scroll position for non-fixed elements */
	if (elementPositionIsFixed === false)
	{
		position.y += document.documentElement.scrollTop;
		position.x += document.documentElement.scrollLeft;
	};
	/* set position */
	element.style.top = Math.round(position.y) + "px";
	element.style.left = Math.round(position.x) + "px";
};

htmlBuilder.newElement = function (nodeDefinition, ...params)
 
{
	let htmlTag = /^[^#.\s]+/.exec(nodeDefinition)[0];
	let result = document.createElement(htmlTag);
	let idDefinition = /#([^.\s]+)/.exec(nodeDefinition);
	(!!idDefinition) ? result.id = idDefinition[1] : null;
	let cssClassesRex = /\.([^.\s]+)/g;
	let cssClassMatch = cssClassesRex.exec(nodeDefinition);
	while (!!cssClassMatch)
	{
		result.classList.add(cssClassMatch[1]);
		cssClassMatch = cssClassesRex.exec(nodeDefinition);
	};
	console.log(params);
	for (let param of params)
	{
		console.log(param);
		if (typeof param === "string")
		{
			result.innerHTML = param;
		}
		else if ((typeof param === "object") && (param.constructor === Object))
		{
			for (let attributeKey in param)
			{
				if (attributeKey.startsWith("data-"))
				{
					result.setAttribute(attributeKey, param[attributeKey]);
				}
				else
				{
					result[attributeKey] = param[attributeKey];
				};
			};
		}
		else
		{
			throw new TypeError("Expected string or object, got " + (typeof param));
		};
	};
	return result;
};

htmlBuilder.removeNodesByQuerySelectors = function (querySelectors, rootNode = document)
{
	for (let s = 0, ss = querySelectors.length; s < ss; s += 1)
	{
		let nodes = rootNode.querySelectorAll(querySelectors[s]);
		for (let n = 0, nn = nodes.length; n < nn; n += 1)
		{
			nodes[n].remove();
		};
	};
};

htmlBuilder.removeClasses = function (classes, rootNode = document)
{
	for (let c = 0, cc = classes.length; c < cc; c += 1)
	{
		rootNode.classList.remove(classes[c]);
		let nodes = rootNode.querySelectorAll("." + classes[c]);
		for (let n = 0, nn = nodes.length; n < nn; n += 1)
		{
			nodes[n].classList.remove(classes[c]);
		};
	};
};
