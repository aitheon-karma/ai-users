const https = require('https');
const config = require('../../../config');
const PIPEDRIVE_ERROR = '[pipedrive error]: ';
const PIPEDRIVE_DEFAULT_STAGE_ID = 65;
const PATH_PREFIX = '/api/v1';
const MAP_DEFAULT_TO_FORM_FIELDS_MAP = {
  '94aaa557a387cadac3ca3815258fa1da76847a27': 'description',
  '2df2a0551c73a00847c5c11ce0a9614ce5a27eb1': 'source'
};

const MAP_ORGANIZATION_FIELDS = {};
async function createPerson(opts, organizationId) {
  try{
    let {email} = opts;
    let result = await api.getExistingContactByEmail(email);
    if(result && result.success === false) {
      throw new Error(PIPEDRIVE_ERROR + (result.error ? result.error : ''));
    }
    if(result && result.success === true && (!result.data || !result.data.items || result.data.items.length === 0)) {
      let mask = await getMask('person');
      if(mask && mask.success === false) {
        throw new Error(PIPEDRIVE_ERROR + (mask.error ? mask.error : ''));
      }
      let pld = mask.data.reduce((a,e) => {
        return applyMask(a,e,opts, MAP_DEFAULT_TO_FORM_FIELDS_MAP);
      }, {});
      if(organizationId) {
        pld.org_id = organizationId;
      }
      let newPerson = await api.newPerson(pld);
      if(newPerson && newPerson.success === false) {
        throw new Error(PIPEDRIVE_ERROR + (newPerson.error ? newPerson.error : '') + ' ' + (pld && pld.toString && pld.toString()));
      }
      result = newPerson.data;
    } else if(result && result.data && result.data.items) {
      result = result.data.items[0].item;
    }
    return result;
  } catch(err) {
    throw new Error(PIPEDRIVE_ERROR + 'Failed to create contact: ' + err.toString());
  }
};

async function createOrganization(opts) {
  try{
    let {company} = opts;
    if(!company) {
      return undefined;
    }
    let result = await api.getExistingOrganizationByName(company);
    if(result && result.success === false) {
      throw new Error(PIPEDRIVE_ERROR + (result.error ? result.error : ''));
    }
    if(result && result.success === true && (!result.data || !result.data.items || result.data.items.length === 0)) {
      let mask = await getMask('organization');
      if(mask && mask.success === false) {
        throw new Error(PIPEDRIVE_ERROR + (mask.error ? mask.error : ''));
      }
      let pld = mask.data.reduce((a,e) => {
        return applyMask(a,e,opts, MAP_ORGANIZATION_FIELDS);
      }, {});

      pld.name = company;
      
      let newOrganization = await api.newOrganization(pld);
      if(newOrganization && newOrganization.success === false) {
        throw new Error(PIPEDRIVE_ERROR + (newOrganization.error ? newOrganization.error : '') + ' ' + (pld && pld.toString && pld.toString()));
      }
      result = newOrganization.data;
    } else if(result && result.data && result.data.items) {
      result = result.data.items[0].item;
    }
    return result;
  } catch(err) {
    throw new Error(PIPEDRIVE_ERROR + 'Failed to create organization: ' + err.toString());
  }
};

module.exports.submit = async function (payload, options) {
  return await createDeal(payload, options);
}

async function createDeal(payload, options) {
  try {
    let organization;
    if(options && options.createOrg == true) {
      organization = await createOrganization(payload);
    }
    let person = await createPerson(payload, organization && organization.id);
    if(!person || !person.id) {
      throw new Error(PIPEDRIVE_ERROR, 'Person not resolved');
    }
    let mask = await getMask('deal');
    let pld = mask.data.reduce((a,e) => {
      return applyMask(a,e,payload, MAP_DEFAULT_TO_FORM_FIELDS_MAP);
    }, {});
    let note = await api.newNote({
      content: Object.entries(payload).reduce((a,e)=>{
        let field = mask && mask.data && mask.data.constructor === Array && mask.data.find(m=>(m && m.key === e[0]));
        a += `<p><b>${field ? field.name : e[0]}</b>:${e[1]}</p>`;
        return a;
      }, ''),
      person_id: person.id
    });
    if(organization && organization.id) {
      pld.org_id = organization.id;
    }
    let resultDeal = await api.newDeal({
      ...pld,
      person_id: person.id,
      stage_id: PIPEDRIVE_DEFAULT_STAGE_ID
    });
    if(resultDeal && resultDeal.success === false) {
      throw new Error(PIPEDRIVE_ERROR + (resultDeal.error ? resultDeal.error : '') + ' ' + (pld && pld.toString && pld.toString()));
    }
  }catch(err) {
    throw new Error(PIPEDRIVE_ERROR + 'Failed to create deal: ' + err.toString());
  }
};

let api = {
  newOrganization: async function(pld) {
    return await this.request({
      path: `${PATH_PREFIX}/organizations?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}`,
      method: 'POST',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    }, pld);
  },
  newPerson: async function(pld) {
    return await this.request({
      path: `${PATH_PREFIX}/persons?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}`,
      method: 'POST',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    }, pld);
  },
  newDeal: async function(pld) {
    return await this.request({
      path: `${PATH_PREFIX}/deals?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}`,
      method: 'POST',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    }, pld);
  },
  newNote: async function(pld) {
    return await this.request({
      path: `${PATH_PREFIX}/notes?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}`,
      method: 'POST',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    }, pld);
  },
  getFields: async function(entity) {
    let fields = await this.request({
      path: `${PATH_PREFIX}/${entity}Fields?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}`,
      method: 'GET',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    });
    if(fields.errors) {
      throw new Error(PIPEDRIVE + JSON.stringify(fields.errors));
    }
    return fields;
  },
  getExistingContactByEmail: async function(email) {
    return await this.request({
      path: `${PATH_PREFIX}/persons/search?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}&term=${encodeURI(email)}&fields=email&exact_match=true`,
      method: 'GET',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    });
  },
  getExistingOrganizationByName: async function(name) {
    return await this.request({
      path: `${PATH_PREFIX}/organizations/search?api_token=${config.pipedrive.PIPEDRIVE_API_KEY}&term=${encodeURI(name)}&fields=name&exact_match=true`,
      method: 'GET',
      host: config.pipedrive.host,
      protocol: 'https:',
      headers: {}
    });
  },
  request: function(opts, body) {
    return new Promise((resolve, reject) => {
      try {
        if(body){
          body = JSON.stringify(body);
          opts.headers['Content-Type'] = 'application/json';
          opts.headers['Content-Length'] = Buffer.byteLength(body);
        }
        let req = https.request(opts, (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              body = JSON.parse(body);
              return resolve(body);
            } catch(err) {
              console.error(body);
              return reject(err);
            }
          });
        });
        req.on('error', (err) => {
          return reject(err);
        });
        if(body){
          req.write(body);
        }
        req.end();
      }catch(err) {
        return reject(err);
      }
    });
  }
}

async function getMask(entity) {
  try{
    if(Object.prototype.toString.call(entity) !== '[object String]') {
      throw new Error(PIPEDRIVE_ERROR + 'Fields mask could not be derived: ' + 'String entity argument required to get the fields mask');
    }
    let mask = await api.getFields(entity);
    if(!mask || mask.success !== true || !mask.data || mask.data.length === 0){
      throw new Error(PIPEDRIVE_ERROR + 'Fields mask could not be derived');
    }
    return mask;
  } catch(err) {
    throw new Error(PIPEDRIVE_ERROR + 'Fields mask could not be derived: ' + err.toString());
  }
}

function applyMask(a, e, opts, map) {
  let name = map && map[e.key];
  if(opts[e.key]){
    a[e.key] = opts[e.key];
  }else if(name && opts[name] && (!e.options || e.options.find((e)=>e.label === opts[name]))) {
    a[e.key] = opts[name];
  }
  return a;
}
