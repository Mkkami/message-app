import { zxcvbnOptions } from "@zxcvbn-ts/core";
import * as common from '@zxcvbn-ts/language-common';
import * as en from '@zxcvbn-ts/language-en';
import * as pl from '@zxcvbn-ts/language-pl';

export const setupZxcvbn = () => {
    const options = {
        translations: en.translations,
        graphs: common.adjacencyGraphs,
        dictionary: {
            ...common.dictionary,
            ...en.dictionary,
            ...pl.dictionary,
        },
    };
    zxcvbnOptions.setOptions(options);
};