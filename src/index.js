import PropTypes from 'prop-types';
// import { render as preactRender, cloneElement as preactCloneElement, h, Component as PreactComponent, options } from 'preact';
import {
	Children,
	render,
	Component as PreactComponent,
	PureComponent,
	hydrate,
	createPortal,
	findDOMNode,
	unmountComponentAtNode,
	findComponentInstance,
	setNativeProps,
	createContext,
	createElement, cloneElement, isValidElement, createFactory
} from 'rax';

const version = '15.1.0'; // trick libraries to think we are react

const ELEMENTS = 'a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr circle clipPath defs ellipse g image line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan'.split(' ');

const REACT_ELEMENT_TYPE = (typeof Symbol !== 'undefined' && Symbol.for && Symbol.for('react.element')) || 0xeac7;

const BYPASS_HOOK = {};

/*global process*/
let DEV = false;
try {
	DEV = process.env.NODE_ENV !== 'production';
}
catch (e) { }

// make react think we're react.
let VNode = createElement('a', null).constructor;
VNode.prototype.$$typeof = REACT_ELEMENT_TYPE;
VNode.prototype.preactCompatUpgraded = false;
VNode.prototype.preactCompatNormalized = false;

Object.defineProperty(VNode.prototype, 'type', {
	get() { return this.nodeName; },
	set(v) { this.nodeName = v; },
	configurable: true
});

/** Track current render() component for ref assignment */
let currentComponent;

let DOM = {};
for (let i = ELEMENTS.length; i--;) {
	DOM[ELEMENTS[i]] = createFactory(ELEMENTS[i]);
}

function extend(base, props) {
	for (let i = 1, obj; i < arguments.length; i++) {
		if ((obj = arguments[i])) {
			for (let key in obj) {
				if (obj.hasOwnProperty(key)) {
					base[key] = obj[key];
				}
			}
		}
	}
	return base;
}

function callMethod(ctx, m, args) {
	if (typeof m === 'string') {
		m = ctx.constructor.prototype[m];
	}
	if (typeof m === 'function') {
		return m.apply(ctx, args);
	}
}

function multihook(hooks, skipDuplicates) {
	return function () {
		let ret;
		for (let i = 0; i < hooks.length; i++) {
			let r = callMethod(this, hooks[i], arguments);

			if (skipDuplicates && r != null) {
				if (!ret) ret = {};
				for (let key in r) if (r.hasOwnProperty(key)) {
					ret[key] = r[key];
				}
			}
			else if (typeof r !== 'undefined') ret = r;
		}
		return ret;
	};
}


function newComponentHook(props, context) {
	propsHook.call(this, props, context);
	this.componentWillReceiveProps = multihook([propsHook, this.componentWillReceiveProps || 'componentWillReceiveProps']);
	this.render = multihook([propsHook, beforeRender, this.render || 'render', afterRender]);
}


function propsHook(props, context) {
	if (!props) return;

	// React annoyingly special-cases single children, and some react components are ridiculously strict about this.
	let c = props.children;
	if (c && Array.isArray(c) && c.length === 1 && (typeof c[0] === 'string' || typeof c[0] === 'function' || c[0] instanceof VNode)) {
		props.children = c[0];

		// but its totally still going to be an Array.
		if (props.children && typeof props.children === 'object') {
			props.children.length = 1;
			props.children[0] = props.children;
		}
	}

	// add proptype checking
	if (DEV) {
		let ctor = typeof this === 'function' ? this : this.constructor,
			propTypes = this.propTypes || ctor.propTypes;
		const displayName = this.displayName || ctor.name;

		if (propTypes) {
			PropTypes.checkPropTypes(propTypes, props, 'prop', displayName);
		}
	}
}


function beforeRender(props) {
	currentComponent = this;
}

function afterRender() {
	if (currentComponent === this) {
		currentComponent = null;
	}
}

function Component(props, context, opts) {
	PreactComponent.call(this, props, context);
	this.state = this.getInitialState ? this.getInitialState() : {};
	this.refs = {};
	this._refProxies = {};
	if (opts !== BYPASS_HOOK) {
		newComponentHook.call(this, props, context);
	}
}
extend(Component.prototype = new PreactComponent(), {
	constructor: Component,

	isReactComponent: {},

	replaceState(state, callback) {
		this.setState(state, callback);
		for (let i in this.state) {
			if (!(i in state)) {
				delete this.state[i];
			}
		}
	},

	getDOMNode() {
		return this.base;
	},

	isMounted() {
		return !!this.base;
	}
});

function unstable_batchedUpdates(callback) {
	callback();
}

export {
	version,
	DOM,
	PropTypes,
	Children,
	render,
	createPortal,
	createFactory,
	createElement,
	cloneElement,
	isValidElement,
	findDOMNode,
	unmountComponentAtNode,
	Component,
	PureComponent,
	unstable_batchedUpdates,
	extend as __spread
};

export default {
	version,
	DOM,
	PropTypes,
	Children,
	render,
	createPortal,
	createFactory,
	createElement,
	cloneElement,
	isValidElement,
	findDOMNode,
	unmountComponentAtNode,
	Component,
	PureComponent,
	unstable_batchedUpdates,
	__spread: extend
};
