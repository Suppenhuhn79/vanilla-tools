"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

/*
requires htmlbuilder.js
 */

class Menubox
{
	constructor(id, menuJson)
	{
		function _createMenuButtons(menuButtonsJson, menubox)
		{
			let buttonsContainerNode = htmlBuilder.newElement("div.buttons");
			for (let b = 0, bb = menuButtonsJson.length; b < bb; b += 1)
			{
				let menuButton = menuButtonsJson[b];
				let buttonNode = htmlBuilder.newElement("div",
				{
					"data-menubutton": menuButton.key,
					"innerHTML": menuButton.text,
					"onclick": Menubox.onMenuItemClick
				}
					);
				buttonsContainerNode.appendChild(buttonNode);
			};
			menubox.element.appendChild(buttonsContainerNode);
		};
		this.id = id;
		this.element = htmlBuilder.newElement("div",
		{
			"data-menubox": id
		}
			);
		this.element.style.position = (menuJson.position !== undefined) ? menuJson.position : "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		this.element.style.visibility = "hidden";
		if (menuJson["class"] !== undefined)
		{
			let classes = menuJson["class"].split(" ");
			for (let c = 0, cc = classes.length; c < cc; c += 1)
			{
				this.element.classList.add(classes[c]);
			};
		};
		if (menuJson.multiselect === true)
		{
			this.element.setAttribute("data-multiselect", "yes");
		};
		if (menuJson.title !== undefined)
		{
			let menuTitle = htmlBuilder.newElement("div.title",
			{
				"innerHTML": menuJson.title
			}
				);
			this.element.appendChild(menuTitle);
		};
		let itemsContainerNode = htmlBuilder.newElement("div.items");
		this.element.appendChild(itemsContainerNode);
		this.buildMenuItems(menuJson);
		if ((menuJson.buttons !== undefined) && (menuJson.buttons.constructor === Array))
		{
			_createMenuButtons(menuJson.buttons, this);
		};
		let existingMenu = document.querySelector("[data-menubox=\"" + id + "\"]");
		(existingMenu !== null) ? existingMenu.remove():null;
		document.body.appendChild(this.element);
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
			let selectedItems = menuNode.querySelectorAll("[data-menuitem].selected");
			for (let i = 0, ii = selectedItems.length; i < ii; i += 1)
			{
				menuEvent.detail.selectedKeys.push(selectedItems[i].getAttribute("data-menuitem"));
			};
			window.dispatchEvent(new CustomEvent("menubox", menuEvent));
			Menubox.hideAll();
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
				Menubox.hideAll();
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
		this.element.replaceChild(itemsContainerNode, this.element.querySelector("div.items"));
	};

	selectItem(itemKey, beSelected = true)
	{
		if (this.element.getAttribute("data-multiselect") !== "yes")
		{
			let items = this.element.querySelectorAll("[data-menuitem]");
			for (let i = 0, ii = items.length; i < ii; i += 1)
			{
				items[i].classList.remove("selected");
			};
		};
		let selectedItem = this.element.querySelector("[data-menuitem=\"" + itemKey + "\"]");
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

	popup(clickEvent, context = null, anchorElement, adjustment = "start left, below bottom")
	{
		Menubox.hideAll();
		if (clickEvent instanceof Event)
		{
			clickEvent.stopPropagation();
			this.element.style.top = clickEvent.clientY + document.documentElement.scrollTop + "px";
			this.element.style.left = clickEvent.clientX + document.documentElement.scrollLeft + "px";
		};
		this.element.setAttribute("data-context", context);
		if (anchorElement instanceof HTMLElement)
		{
			htmlBuilder.adjust(this.element, anchorElement, adjustment);
		}
		this.element.style.visibility = "visible";
	};

};

window.addEventListener("click", (clickEvent) =>
{
	if (clickEvent.target.closest("[data-menubox]") === null)
	{
		Menubox.hideAll();
	}
}
);
