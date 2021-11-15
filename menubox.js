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
		}
		this.eventHandler = eventHandler;
		this.parentMenubox = _parentMenubox;
		this.selectMode = menuJson.selectMode ?? ((menuJson.multiselect === true) ? Menubox.SELECT_MODE.multiselect : Menubox.SELECT_MODE.normal);
		this.multiselect = ([Menubox.SELECT_MODE.multiselect, Menubox.SELECT_MODE.multiselect_interactive].includes(this.selectMode));
		this.items = {};
		this.adjust = Object.assign({ visibility: ["hidden", "visible"] }, menuJson.adjust);
		this.element = htmlBuilder.newElement("div.menubox",
		{
			'data-menubox': id,
			onclick: (evt) => { evt.stopPropagation(); }
		}, htmlBuilder.newElement("div", htmlBuilder.newElement("div.items"))); // wrapper DIV is required for transistions
		if (_parentMenubox)
		{
			this.element.classList.add("submenu");
		}
		this.element.style.position = menuJson.position ?? "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		if (typeof menuJson.css === "string")
		{
			for (let cssClass of menuJson.css.split(" "))
			{
				this.element.classList.add(cssClass);
			}
		}
		this.setTitle(menuJson.title);
		this.setItems((menuJson.items instanceof Array) ? menuJson.items : menuJson);
		if (menuJson.buttons instanceof Array)
		{
			let buttonsContainer = htmlBuilder.newElement("div.buttons");
			for (let menuButton of menuJson.buttons)
			{
				buttonsContainer.appendChild(htmlBuilder.newElement("div.menubutton",
					{
						'data-menubutton': menuButton.key,
						onclick: Menubox.onMenuItemClick
					},
					menuButton.label ?? menuButton.key));
			}
			this.element.firstElementChild.appendChild(buttonsContainer);
		}
		document.body.appendChild(this.element);
		Menubox.instances[this.id] = this;
		Menubox.closeAll();
	};

	static EVENT_ID = "menubox";

	static SELECT_MODE = {
		normal: 0,
		persistent: 1,
		multiselect: 2,
		multiselect_interactive: 3
	};
	
	static instances = {};

	static hideAll(exceptFor = "")
	{
		console.warn("Menubox.hideAll() is deprecated and will be removed in the next release. Use Menubox.closeAll() instead.");
		Menubox.closeAll(exceptFor);
	};
	
	static closeAll(exceptFor = "")
	{
		for (let key in Menubox.instances)
		{
			if (exceptFor.startsWith(key) === false)
			{
				Menubox.instances[key].close();
			}
		}
	};

	static onMenuItemClick(clickEvent)
	{
		clickEvent.stopPropagation();
		if ((clickEvent.target instanceof HTMLInputElement === false) && (clickEvent.target.classList.contains("disabled") === false))
		{
			let menuboxItem = clickEvent.target.closest("[data-menuitem]");
			let menuboxButton = clickEvent.target.closest("[data-menubutton]");
			let menubox = Menubox.instances[clickEvent.target.closest("[data-menubox]").getAttribute("data-menubox")];
			let submenuId = menuboxItem?.getAttribute("data-submenu");
			if (menuboxItem)
			{
				if (submenuId)
				{
					let submenu = menubox.submenus[submenuId];
					Menubox.closeAll(submenuId);
					submenu.popup(clickEvent, menubox.context, menuboxItem, submenu.alignment);
				}
				else if (menubox.multiselect)
				{
					menuboxItem.classList.toggle("selected");
				}
			}
			if (((menubox.selectMode === Menubox.SELECT_MODE.normal) || (menuboxButton)) && (!submenuId))
			{
				Menubox.closeAll();
			}
			if ((menubox.selectMode !== Menubox.SELECT_MODE.multiselect) || (menuboxButton))
			{
				/* dispatch event */
				let eventDetails =
				{
					context: menubox.context,
					menubox: menubox
				};
				if (menuboxItem) {
					eventDetails.itemKey = menuboxItem.getAttribute("data-menuitem");
				}
				else if (menuboxButton)
				{
					eventDetails.buttonKey = menuboxButton.getAttribute("data-menubutton");
				}
				if (menubox.multiselect)
				{
					eventDetails.selectedKeys = [];
					for (let item of menubox.element.querySelectorAll("[data-menuitem].selected"))
					{
						eventDetails.selectedKeys.push(item.getAttribute("data-menuitem"));
					}
				}
				if (typeof menubox.eventHandler === "function")
				{
					menubox.eventHandler(Object.assign(eventDetails, { originalEvent: clickEvent}));
				}
				else
				{
					window.dispatchEvent(new CustomEvent(Menubox.EVENT_ID, { detail: eventDetails }));
				}
			}
		}
	};

	_setVisibility(visible)
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
			}
			this.element.style[key] = styleValue;
		}
	};

	setItems(itemDefs)
	{
		this.items = {};
		htmlBuilder.removeAllChildren(this.element.querySelector("div.items"));
		if (itemDefs instanceof Array)
		{
			for (let itemDef of itemDefs)
			{
				this.appendItem(itemDef);
			}
		}
		else
		{
			for (let key in itemDefs)
			{
				this.appendItem({
					[key]: itemDefs[key]
				});
			}
		}
	};

	appendItem(itemDef)
	{
		function _copyProperties(itemDef, itemElement)
		{
			for (let itemDefKey in itemDef)
			{
				if (["key", "label", "input"].includes(itemDefKey) === false)
				{
					itemElement[itemDefKey] = itemDef[itemDefKey];
				}
			}
		};
		function _createInputElement(itemDef)
		{
			let inputElement = htmlBuilder.newElement("input", { type: itemDef.input });
			_copyProperties(itemDef, inputElement);
			return inputElement;
		};
		function _createSubmenu(menubox, itemElement, itemDef)
		{
			let submenuId = menubox.id + "::" + itemDef.key;
			itemElement.setAttribute("data-submenu", submenuId);
			itemElement.classList.add("submenu");
			menubox.submenus ??= {};
			menubox.submenus[submenuId] = new Menubox(submenuId, itemDef.submenu, menubox.eventHandler, menubox);
			menubox.submenus[submenuId].alignment = itemDef.submenu.alignment ?? "start right, below top";
		};
		function _appendItemObject(menubox, itemKey, itemElement)
		{
			menubox.items[itemKey] =
			{
				isSelected: () => itemElement.classList.contains("selected"),
				setSelected: (selected = true) => {
					if (menubox.multiselect === false)
					{
						for (let item of menubox.element.querySelectorAll("[data-menuitem].selected"))
						{
							item.classList.remove("selected");
						}
					}
					(selected) ? itemElement.classList.add("selected") : itemElement.classList.remove("selected");
				},
				isEnabled: () => !itemElement.classList.contains("disabled"),
				setEnabled: (enabled = true) => { (enabled) ? itemElement.classList.remove("disabled") : itemElement.classList.add("disabled"); },
				setVisible: (visible = true) => { itemElement.style.display = (visible) ? "initial" : "none"; },
				element: itemElement
			};
		};
		if ((itemDef.key === undefined) && (itemDef.separator === undefined) && (itemDef.html === undefined) && (itemDef.href === undefined))
		{
			for (let key in itemDef)
			{
				if (typeof itemDef[key] === "string")
				{
					itemDef =
					{
						key: key,
						label: itemDef[key]
					};
				}
				else
				{
					itemDef =
					{
						separator: {}
					};
				}
				break;
			}
		}
		let itemElement;
		if (itemDef.separator)
		{
			itemElement = htmlBuilder.newElement("div.separator", "\u00a0");
		}
		else if (itemDef.href)
		{
			itemElement = htmlBuilder.newElement("a.menuitem", itemDef.label ?? itemDef.href, {onclick: (evt) => Menubox.closeAll()});
			_copyProperties(itemDef, itemElement);
		}
		else if ((itemDef.html) && (!itemDef.key))
		{
			itemElement = itemDef.html;
		}
		else if (itemDef.key)
		{
			if (!this.items[itemDef.key])
			{
				itemElement = htmlBuilder.newElement("div.menuitem",
				{
					'data-menuitem': itemDef.key,
					onclick: itemDef.onclick ?? Menubox.onMenuItemClick
				}, itemDef.html ?? itemDef.label ?? ((itemDef.input) ? "" : itemDef.key));
				if (itemDef.input)
				{
					itemElement.appendChild(_createInputElement(itemDef));
				}
				else if (itemDef.submenu)
				{
					_createSubmenu(this, itemElement, itemDef);
				}
				else if (this.multiselect)
				{
					itemElement.classList.add("multiselect");
				}
				_appendItemObject(this, itemDef.key, itemElement);
			}
			else
			{
				console.warn("Menubox item \"" + itemDef.key + "\" does already exist.", this, itemDef);
			}
		}
		if (itemElement)
		{
			if (itemDef.icon)
			{
				itemElement.insertBefore(htmlBuilder.newElement("img", { src: itemDef.icon }), itemElement.firstChild);
			}
			if (itemDef.iconFontAwesome)
			{
				itemElement.insertBefore(htmlBuilder.newElement("i." + itemDef.iconFontAwesome.replace(" ", ".")), itemElement.firstChild);
			}
			if (itemDef.selected)
			{
				itemElement.classList.add("selected");
			}
			if (itemDef.enabled === false)
			{
				itemElement.classList.add("disabled");
			}
			this.element.querySelector("div.items").appendChild(itemElement);
		}
	};

	selectItem(itemKey, beSelected = true)
	{
		console.warn("<menubox>.selectItem() is deprecated and will be removed in the next release. Use <menubox>.items.<itemkey>.setSelected() instead.");
		this.items[itemKey].setSelected(beSelected);
	};

	setTitle(title)
	{
		let wrapperElement = this.element.firstElementChild;
		if (typeof title === "string")
		{
			let titleElement = wrapperElement.querySelector(".title");
			if (!titleElement)
			{
				titleElement = htmlBuilder.newElement("div.title");
				wrapperElement.insertBefore(titleElement, wrapperElement.firstElementChild);
			}
			titleElement.innerText = title;
		}
		else
		{
			wrapperElement.querySelector(".title")?.remove();
		}
	};
	
	popup(clickEvent, context = null, anchorElement = null, adjustment = "start left, below bottom")
	{
		if (!this.parentMenubox)
		{
			Menubox.closeAll();
		}
		if (clickEvent instanceof MouseEvent)
		{
			clickEvent.stopPropagation();
			if ((anchorElement instanceof HTMLElement) === false)
			{
				this.element.style.top = clickEvent.clientY + document.documentElement.scrollTop + "px";
				this.element.style.left = clickEvent.clientX + document.documentElement.scrollLeft + "px";
			}
		}
		if (anchorElement instanceof HTMLElement)
		{
			htmlBuilder.adjust(this.element, anchorElement, adjustment);
		}
		this.context = context;
		this._setVisibility(true);
	};
	
	close()
	{
		this._setVisibility(false);
	};

};

window.addEventListener("click", (clickEvent) => {
	if (clickEvent.target.closest("[data-menubox]") === null)
	{
		Menubox.closeAll();
	}
});
