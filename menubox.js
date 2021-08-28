"use strict";

/*
This is a file from Vanilla-Tools (https://github.com/suppenhuhn79/vanilla-tools)
Copyright 2021 Christoph Zager, licensed under the Apache License, Version 2.0
See the full license text at http://www.apache.org/licenses/LICENSE-2.0
 */

/* requires htmlbuilder.js */

class Menubox
{
	constructor(id, menuJson, eventHandler = null, _parentMenubox = null)
	{
		this.id = id;
		if (Menubox.instances[this.id])
		{
			console.info("Menubox \"" + this.id + "\" already existed, has been replaced.");
			document.body.querySelector("[data-menubox=\"" + id + "\"]")?.remove();
		};
		this.eventHandler = eventHandler;
		this.parentMenubox = _parentMenubox;
		this.multiselect = (menuJson.multiselect === true);
		this.adjust = Object.assign(
		{
			"visibility": ["hidden", "visible"]
		}, menuJson.adjust);
		let container = htmlBuilder.newElement("div");
		this.element = htmlBuilder.newElement("div.menubox",
		{
			"data-menubox": id,
			"onclick": (evt) => { evt.stopPropagation(); }
		}, container);
		if (_parentMenubox)
		{
			this.element.setAttribute("data-parentmenubox", _parentMenubox.id);
		};
		this.element.style.position = menuJson.position ?? "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		if (typeof menuJson.css === "string")
		{
			for (let cssClass of menuJson.css.split(" "))
			{
				this.element.classList.add(cssClass);
			};
		};
		document.body.appendChild(this.element);
		if (typeof menuJson.title === "string")
		{
			container.appendChild(htmlBuilder.newElement("div.title", menuJson.title));
		};
		container.appendChild(htmlBuilder.newElement("div.items"));
		this.setItems((menuJson.items instanceof Array) ? menuJson.items : menuJson);
		if (menuJson.buttons instanceof Array)
		{
			let buttonsContainer = htmlBuilder.newElement("div.buttons");
			for (let menuButton of menuJson.buttons)
			{
				buttonsContainer.appendChild(htmlBuilder.newElement("div",
					{
						"data-menubutton": menuButton.key,
						"onclick": Menubox.onMenuItemClick
					},
						menuButton.label));
			};
			container.appendChild(buttonsContainer);
		};
		Menubox.instances[this.id] = this;
		Menubox.hideAll();
	};

	static EVENT_ID = "menubox";

	static instances = {};

	static hideAll(exceptFor = "")
	{
		for (let key in Menubox.instances)
		{
			if (exceptFor.startsWith(key) === false)
			{
				Menubox.instances[key].setVisibility(false);
			}
		};
	};

	static onMenuItemClick(clickEvent)
	{
		function _dispatchEvent(eventDetails)
		{
			Menubox.hideAll();
			if (typeof eventDetails.menubox.eventHandler === "function")
			{
				eventDetails.menubox.eventHandler(Object.assign(eventDetails, {originalEvent: clickEvent}));
			}
			else
			{
				window.dispatchEvent(new CustomEvent(Menubox.EVENT_ID, { detail: eventDetails }));
			};
		};
		clickEvent.stopPropagation();
		let menuboxItem = clickEvent.target.closest("[data-menuitem]");
		let menubox = Menubox.instances[clickEvent.target.closest("[data-menubox]").getAttribute("data-menubox")];
		let eventDetails = {
			"context": menubox.context,
			"menubox": menubox
		};
		if (clickEvent.target.getAttribute("data-menubutton"))
		{
			eventDetails.buttonKey = clickEvent.target.getAttribute("data-menubutton");
			eventDetails.selectedKeys = [];
			for (let item of menubox.element.querySelectorAll("[data-menuitem].selected"))
			{
				eventDetails.selectedKeys.push(item.getAttribute("data-menuitem"));
			};
			_dispatchEvent(eventDetails);
		}
		else if (menuboxItem.getAttribute("data-submenu"))
		{
			let submenuId = menuboxItem.getAttribute("data-submenu");
			let submenu = menubox.submenus[submenuId];
			Menubox.hideAll(submenuId);
			submenu.popup(clickEvent, menubox.context, menuboxItem, submenu.alignment);
		}
		else
		{
			if (menubox.multiselect)
			{
				clickEvent.target.classList.toggle("selected");
			}
			else if (clickEvent.target.classList.contains("disabled") === false)
			{
				eventDetails.itemKey = menuboxItem.getAttribute("data-menuitem");
				_dispatchEvent(eventDetails);
			};
		};
	};

	setVisibility(visible)
	{
		let styleIndex = (visible) ? 1 : 0;
		for (let key in this.adjust)
		{
			let styleValue = this.adjust[key][styleIndex];
			if ((key === "height") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetHeight + "px";
			}
			else if ((key === "width") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetWidth + "px";
			};
			this.element.style[key] = styleValue;
		};
	};

	setItems(itemDefs)
	{
		let itemsContainer = this.element.querySelector("div.items");
		htmlBuilder.removeAllChildren(itemsContainer);
		if (itemDefs instanceof Array)
		{
			for (let itemDef of itemDefs)
			{
				this.appendItem(itemDef);
			};
		}
		else
		{
			for (let key in itemDefs)
			{
				this.appendItem(
				{
					[key]: itemDefs[key]
				}
				);
			};
		};
	};

	appendItem(itemDef)
	{
		if ((itemDef.key === undefined) && (itemDef.separator === undefined) && (itemDef.html === undefined))
		{
			for (let key in itemDef)
			{
				if (typeof itemDef[key] === "string")
				{
					itemDef =
					{
						"key": key,
						"label": itemDef[key]
					};
				}
				else
				{
					itemDef =
					{
						"separator": {}
					}
				};
				break;
			};
		};
		let itemNode;
		if (itemDef.key !== undefined)
		{
			itemNode = htmlBuilder.newElement("div.menuitem",
			{
				"data-menuitem": itemDef.key,
				"onclick": itemDef.onclick ?? Menubox.onMenuItemClick
			}, itemDef.label);
			if (itemDef.icon)
			{
				itemNode.insertBefore(htmlBuilder.newElement("img",
					{
						"src": itemDef.icon
					}
					), itemNode.firstChild);
			};
			if (itemDef.iconFontAwesome)
			{
				itemNode.insertBefore(htmlBuilder.newElement("i." + itemDef.iconFontAwesome.replace(" ", ".")), itemNode.firstChild);
			};
			if (itemDef.selected)
			{
				itemNode.classList.add("selected");
			};
			if (itemDef.enabled === false)
			{
				itemNode.classList.add("disabled");
			};
			if (itemDef.submenu)
			{
				let submenuId = this.id + "::" + itemDef.key;
				itemNode.setAttribute("data-submenu", submenuId);
				this.submenus ??= {};
				this.submenus[submenuId] = new Menubox(submenuId, itemDef.submenu, this.eventHandler, this);
				this.submenus[submenuId].alignment = itemDef.submenu.alignment ?? "start right, below top";
			};
		}
		else if (itemDef.separator)
		{
			itemNode = htmlBuilder.newElement("div.separator", "\u00a0");
		}
		else if (itemDef.html)
		{
			itemNode = itemDef.html;
		};
		this.element.querySelector("div.items").appendChild(itemNode);
	};

	selectItem(itemKey, beSelected = true)
	{
		if (this.multiselect === false)
		{
			for (let item of this.element.querySelectorAll("[data-menuitem]"))
			{
				item.classList.remove("selected");
			};
		};
		let selectedItem = this.element.querySelector("[data-menuitem=\"" + itemKey + "\"]");
		(beSelected) ? selectedItem?.classList.add("selected") : selectedItem?.classList.remove("selected");
	};

	popup(clickEvent, context = null, anchorElement = null, adjustment = "start left, below bottom")
	{
		if (!this.parentMenubox)
		{
			Menubox.hideAll();
		};
		if (clickEvent instanceof MouseEvent)
		{
			clickEvent.stopPropagation();
			if ((anchorElement instanceof HTMLElement) === false)
			{
				this.element.style.top = clickEvent.clientY + document.documentElement.scrollTop + "px";
				this.element.style.left = clickEvent.clientX + document.documentElement.scrollLeft + "px";
			};
		};
		if (anchorElement instanceof HTMLElement)
		{
			htmlBuilder.adjust(this.element, anchorElement, adjustment);
		};
		this.context = context;
		this.setVisibility(true);
	};

};

window.addEventListener("click", (clickEvent) => ((clickEvent.target.closest("[data-menubox]") === null) ? Menubox.hideAll() : null));
