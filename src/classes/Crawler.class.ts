import axios from 'axios';
import {JSDOM, VirtualConsole} from 'jsdom';
import {noop} from 'lodash';

export class Crawler {

    private readonly dom: JSDOM;

    constructor(html: string) {
        const virtualConsole = new VirtualConsole();
        virtualConsole.on("error", noop);
        this.dom = new JSDOM(html, { virtualConsole });
    }

    extractLinks(options: {
        url: URL;
        abolishExternal?: boolean;
    }) {

        let links = [...this.dom.window.document.querySelectorAll('a')]
            .map(element => element.getAttribute('href'))
            .filter(Boolean)
            .filter(href => this.isLinkAbsolute(href!) || this.isLinkRelative(href!))
            .map(href => this.convertLinkRelativeToAbsolute(options.url.origin, href));

        if (options.abolishExternal)
            links = links.filter(href => this.isLinkRelative(href) || new URL(href!).origin === options.url.origin)

        return links;
    }

    extractImagesFromDOM(options: { url: URL }) {
        return [...this.dom.window.document.querySelectorAll('img')]
            .map(element => element.getAttribute('src'))
            .map(href => this.convertLinkRelativeToAbsolute(options.url.origin, href));
    }

    async extractImagesFromCSS(options: { url: URL }) {
        const links = [...this.dom.window.document.querySelectorAll('[rel="stylesheet"]')]
            .map(element => element.getAttribute('href'))
            .map(href => this.convertLinkRelativeToAbsolute(options.url.origin, href));

        const requests = await Promise.all(links.map(link => axios.get(link!)));
        const css = requests.map(({ data }) => data).filter(css => typeof css === 'string').join('');

        const regex = /url[(]['"]?[a-z0-9-_\/]+[.](APNG|AVIF|GIF|JPEG|JPG|PNG|SVG|WebP|BMP|ICO|TIFF)/ig;
        const matches = css.match(regex)
            ?.map(string => string.match(/[a-z0-9-_\/]+[.](APNG|AVIF|GIF|JPEG|JPG|PNG|SVG|WebP|BMP|ICO|TIFF)/ig))
            .map(href => this.convertLinkRelativeToAbsolute(options.url.origin, href))
        return (matches || []) as string[];
    }

    private isLinkAbsolute(href: string): boolean {
        return (/^http/).test(href);
    }

    private isLinkRelative(href: string): boolean {
        return (/^[.]{0,2}[/].+/).test(href);
    }

    private convertLinkRelativeToAbsolute(origin, href) {
        return this.isLinkRelative(href)
            ? new URL(href, origin).toString()
            : href;
    }

}