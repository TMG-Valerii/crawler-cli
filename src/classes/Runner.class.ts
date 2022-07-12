import axios from 'axios';
import {uniq, uniqBy} from 'lodash';
import {Crawler} from './Crawler.class';
import {IResult} from '../interfaces/IResult.inteface';
import {IRunnerData} from '../interfaces/IRunnerData.interface';

export class Runner {

    private pending: string[] = [];
    private visited: string[] = [];
    private result: IResult[] = [];

    constructor(
        private readonly link: string,
        private readonly depth: number,
    ) {
    }

    public async run() {
        const root = new URL(this.link);
        this.pending = [root.href];

        for(let depth = 0; (this.depth + 1) > depth; depth++) {
            const promises = await Promise.allSettled(this.pending.map(address => this.extractDataFromAddress(address)));
            const datasets = promises.filter(promise => promise.status === 'fulfilled').map((promise) => (promise as PromiseFulfilledResult<IRunnerData>).value);
            this.pending = [];
            datasets.forEach(dataset => {
                const { address: sourceUrl, links, images } = dataset;
                const results: IResult[] = images.map(imageUrl => ({ depth, sourceUrl, imageUrl }));
                this.result = [...this.result, ...results];
                this.visited = [...this.visited, sourceUrl];
                this.pending = uniq([...this.pending, ...links]).filter(link => !this.visited.includes(link));
            });
        }

        return uniqBy(this.result, 'imageUrl');
    }

    private async extractHTML(href: string): Promise<string> {
        const { data: html } = await axios.get(href);
        console.log(href);
        return html;
    }

    private async extractDataFromAddress(address: string): Promise<IRunnerData> {
        const url = new URL(address);
        const html = await this.extractHTML(address);

        const crawler = new Crawler(html);
        const links = crawler.extractLinks({ url, abolishExternal: true });
        const imagesFromDOM = crawler.extractImagesFromDOM({ url });
        const imagesFromCSS = await crawler.extractImagesFromCSS({ url });
        const images = [...imagesFromDOM, ...imagesFromCSS];
        return { address, links, images };
    }

}