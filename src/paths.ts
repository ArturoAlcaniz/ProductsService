import 'module-alias/register';
import { addAliases } from 'module-alias';

addAliases({
    '@entities-lib': `${__dirname}/../../entities-lib`,
    '@config-lib': `${__dirname}/../../config-lib`,
    '@commons': `${__dirname}/commons`,
    '@root': `${__dirname}/..`
});