"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

class Menubox
{
	constructor(id, menuJson)
	{
		function _createMenuButtons(menuButtonsJson, menubox)
		{
			let buttonsContainerNode = document.createElement("div");
			buttonsContainerNode.classList.add("buttons");
			for (let b = 0, bb = menuButtonsJson.length; b < bb; b += 1)
			{
				let menuButton = menuButtonsJson[b];
				let buttonNode = document.createElement("div");
				buttonNode.setAttribute("data-menubutton", menuButton.key);
				buttonNode.innerHTML = menuButton.text;
				buttonNode.onclick = Menubox.onMenuItemClick;
				buttonsContainerNode.appendChild(buttonNode);
			};
			menubox.htmlElement.appendChild(buttonsContainerNode);
		};
		this.id = id;
		this.htmlElement = document.createElement("div");
		this.htmlElement.setAttribute("data-menubox", id);
		this.htmlElement.style.position = "absolute";
		this.htmlElement.style.top = 0;
		this.htmlElement.style.left = 0;
		this.htmlElement.style.visibility = "hidden";
		if (menuJson["class"] !== undefined)
		{
			this.htmlElement.classList.add(menuJson["class"]);
		};
		if (menuJson.multiselect === true)
		{
			this.htmlElement.setAttribute("data-multiselect", "yes");
		};
		if (menuJson.title !== undefined)
		{
			let menuTitle = document.createElement("div");
			menuTitle.classList.add("title");
			menuTitle.innerHTML = menuJson.title;
			this.htmlElement.appendChild(menuTitle);
		};
		let itemsContainerNode = document.createElement("div");
		itemsContainerNode.classList.add("items");
		this.htmlElement.appendChild(itemsContainerNode);
		this.buildMenuItems(menuJson);
		if ((menuJson.buttons !== undefined) && (menuJson.buttons.constructor === Array))
		{
			_createMenuButtons(menuJson.buttons, this);
		};
		document.body.appendChild(this.htmlElement);
	};

	static hideAll()
	{
		let allMenuboxes = document.querySelectorAll("[data-menubox]");
		for (let i = 0, ii = allMenuboxes.length; i < ii; i += 1)
		{
			allMenuboxes[i].style.visibility = "hidden";
		};
	};

	static onMenuItemClick(clickEvent)
	{
		let menuNode = clickEvent.target.closest("[data-menubox]");
		let menuEvent = new CustomEvent("menubox",
		{
			"detail":
			{
				"menuId": menuNode.getAttribute("data-menubox"),
				"context": menuNode.getAttribute("data-context")
			}
		}
			);
		if (clickEvent.target.getAttribute("data-menubutton") !== null)
		{
			menuEvent.detail["buttonKey"] = clickEvent.target.getAttribute("data-menubutton");
			menuEvent.detail["selectedKeys"] = [];
			let selectedItems = menuNode.querySelectorAll(".selected");
			for (let i = 0, ii = selectedItems.length; i < ii; i += 1)
			{
				menuEvent.detail.selectedKeys.push(selectedItems[i].getAttribute("data-menuitem"));
			};
			window.dispatchEvent(new CustomEvent("menubox", menuEvent));
		}
		else
		{
			if (menuNode.getAttribute("data-multiselect") === "yes")
			{
				clickEvent.target.classList.toggle("selected");
				clickEvent.stopPropagation();
			}
			else
			{
				menuEvent.detail["itemKey"] = clickEvent.target.getAttribute("data-menuitem");
				window.dispatchEvent(new CustomEvent("menubox", menuEvent));
			};
		};
	};

	buildMenuItems(menuItems)
	{
		function _convertToAdvancedMenuJson(simpleMenuItems)
		{
			let result = [];
			for (let itemKey in menuItems)
			{
				if (menuItems[itemKey] !== null)
				{
					result.push(
					{
						"key": itemKey,
						"text": menuItems[itemKey]
					}
					);
				}
				else
				{
					result.push(
					{
						"separator": true
					}
					);
				};
			};
			return result;
		};
		if ((menuItems.items !== undefined) && (menuItems.items.constructor === Array))
		{
			menuItems = menuItems.items;
		}
		else if (menuItems.constructor !== Array)
		{
			menuItems = _convertToAdvancedMenuJson(menuItems);
		};
		let itemsContainerNode = document.createElement("div");
		itemsContainerNode.classList.add("items");
		for (let i = 0, ii = menuItems.length; i < ii; i += 1)
		{
			let menuItem = menuItems[i];
			let itemNode = document.createElement("div");
			if (menuItem.separator !== true)
			{
				itemNode.setAttribute("data-menuitem", menuItem.key);
				if (menuItem.selected === true)
				{
					itemNode.classList.add("selected");
				};
				itemNode.innerHTML = menuItem.text;
				itemNode.onclick = Menubox.onMenuItemClick;
				if (typeof menuItem.postrender === "function")
				{
					menuItem.postrender(itemNode);
				};
			}
			else
			{
				itemNode.classList.add("separator");
				itemNode.innerHTML = "&#160;";
			};
			itemsContainerNode.appendChild(itemNode);
		};
		this.htmlElement.replaceChild(itemsContainerNode, this.htmlElement.querySelector("div.items"));
	};

	selectItem(itemKey, beSelected = true)
	{
		if (this.multiselect !== true)
		{
			let items = this.htmlElement.querySelectorAll("[data-menuitem]");
			for (let i = 0, ii = items.length; i < ii; i += 1)
			{
				items[i].classList.remove("selected");
			};
		};
		let selectedItem = this.htmlElement.querySelector("[data-menuitem=\"" + itemKey + "\"]");
		if (selectedItem !== null)
		{
			if (beSelected === true)
			{
				selectedItem.classList.add("selected");
			}
			else
			{
				selectedItem.classList.remove("selected");
			};
		};
	};

	popup(clickEvent, context = null)
	{
		this.popupAt(clickEvent.clientY + document.documentElement.scrollTop, clickEvent.clientX + document.documentElement.scrollLeft, context, clickEvent);
	};

	popupAt(topPosition, leftPosition, context = null, clickEvent = null)
	{
		Menubox.hideAll();
		if (clickEvent instanceof Event)
		{
			clickEvent.stopPropagation();
		};
		this.htmlElement.style.top = topPosition + "px";
		this.htmlElement.style.left = leftPosition + "px";
		this.htmlElement.style.visibility = "visible";
		this.htmlElement.setAttribute("data-context", context);
	};

};

window.addEventListener("click", Menubox.hideAll);
