import * as kue from 'kue';

const queue = kue.createQueue();

export = queue;