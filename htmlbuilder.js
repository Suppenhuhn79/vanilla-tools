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

htmlBuilder.newElement = function (nodeDefinition, ...attributes)
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
	for (let attribute of attributes)
	{
		switch (attribute.constructor.name)
		{
		case "String":
		case "Number":
			result.innerHTML = attribute;
			break;
		case "Object":
			for (let key in attribute)
			{
				let value = attribute[key];
				if (typeof value === "function")
				{
					result[key] = value;
				}
				else
				{
					result.setAttribute(key, value);
				};
			};
			break;
		default:
			if (attribute instanceof HTMLElement)
			{
				result.appendChild(attribute);
			}
			else
			{
				throw new TypeError("Expected String, Number, Object or HTMLElement, got " + ((!!attribute) ? attribute.constructor.name : typeof attribute));
			};
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

htmlBuilder.clear = function (element)
{
	while (!!element.firstChild)
	{
		element.firstChild.remove();
	};
};

htmlBuilder.dataFromElements = function (object, elementRoot)
{
	function processPath(object, path, value)
	{
		if (path.length > 1)
		{
			if (!!object[path[0]])
			{
				processPath(object[path[0]], path.slice(1), value);
			};
		}
		else
		{
			object[path[0]] = value;
		};
	};
	for (let mappedElement of elementRoot.querySelectorAll("[data-value-key]"))
	{
		let elementAttribute = mappedElement.getAttribute("data-value-attribute") ?? "value";
		processPath(object, mappedElement.getAttribute("data-value-key").split("."), mappedElement[elementAttribute]);
	};
};

htmlBuilder.dataToElements = function (object, elementRoot)
{
	function processPath(object, path)
	{
		let result = null;
		if (path.length > 1)
		{
			if (!!object[path[0]])
			{
				result = processPath(object[path[0]], path.slice(1));
			};
		}
		else
		{
			result = object[path[0]];
		};
		return result;
	};
	for (let mappedElement of elementRoot.querySelectorAll("[data-value-key]"))
	{
		let elementAttribute = mappedElement.getAttribute("data-value-attribute") ?? "value";
		mappedElement[elementAttribute] = processPath(object, mappedElement.getAttribute("data-value-key").split("."));
	};
};
