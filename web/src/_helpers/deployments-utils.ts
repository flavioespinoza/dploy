import axios from "axios";
import { default as stableStringify } from "json-stable-stringify";

export class CustomValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CustomValidationError";
  }
}

const specSuffixes = {
  Ki: 1024,
  Mi: 1024 * 1024,
  Gi: 1024 * 1024 * 1024,
  Ti: 1024 * 1024 * 1024 * 1024,
  Pi: 1024 * 1024 * 1024 * 1024 * 1024,
  Ei: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
  K: 1000,
  M: 1000 * 1000,
  G: 1000 * 1000 * 1000,
  T: 1000 * 1000 * 1000 * 1000,
  P: 1000 * 1000 * 1000 * 1000 * 1000,
  E: 1000 * 1000 * 1000 * 1000 * 1000 * 1000,
  Kb: 1000,
  Mb: 1000 * 1000,
  Gb: 1000 * 1000 * 1000,
  Tb: 1000 * 1000 * 1000 * 1000,
  Pb: 1000 * 1000 * 1000 * 1000 * 1000,
  Eb: 1000 * 1000 * 1000 * 1000 * 1000 * 1000
};

// Replicate the HTML escape logic from https://pkg.go.dev/encoding/json#Marshal
function escapeHtml(unsafe) {
  return unsafe.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

// https://github.com/ovrclk/akash/blob/04e7a7667dd94b5a15fa039e4f7df5c9ad93be4f/sdl/sdl.go#L120
export async function ManifestVersion(manifest) {
  var enc = new TextEncoder();
  let jsonStr = JSON.stringify(manifest);

  jsonStr = jsonStr.replaceAll('"quantity":{"val', '"size":{"val');
  jsonStr = jsonStr.replaceAll('"mount":', '"readOnlyTmp":');
  jsonStr = jsonStr.replaceAll('"readOnly":', '"mount":');
  jsonStr = jsonStr.replaceAll('"readOnlyTmp":', '"readOnly":');

  let sortedBytes = enc.encode(SortJSON(jsonStr));

  let sum = await crypto.subtle.digest("SHA-256", sortedBytes);

  return new Uint8Array(sum);
}

// https://github.com/cosmos/cosmos-sdk/blob/9fd866e3820b3510010ae172b682d71594cd8c14/types/utils.go#L29
export function SortJSON(jsonStr) {
  return escapeHtml(stableStringify(JSON.parse(jsonStr)));
}

export function ParseServiceProtocol(input) {
  let result;

  // This is not a case-sensitive parse, so make all input
  // uppercase
  if (input) {
    input = input.toUpperCase();
  }

  switch (input) {
    case "TCP":
    case "":
    case undefined: // The empty string (no input) implies TCP
      result = "TCP";
      break;
    case "UDP":
      result = "UDP";
      break;
    default:
      throw new Error("ErrUnsupportedServiceProtocol");
  }

  return result;
}

export async function getCurrentHeight(apiEndpoint) {
  const response = await axios.get(`${apiEndpoint}/blocks/latest`);
  const data = response.data;

  const height = parseInt(data.block.header.height);
  return height;
}

export function parseSizeStr(str) {
  try {
    const suffix = Object.keys(specSuffixes).find((s) => str.toString().toLowerCase().endsWith(s.toLowerCase()));

    if (suffix) {
      const suffixPos = str.length - suffix.length;
      const numberStr = str.substring(0, suffixPos);
      return parseFloat(numberStr) * specSuffixes[suffix];
    } else {
      return parseFloat(str);
    }
  } catch (err) {
    console.error(err);
    throw new Error("Error while parsing size: " + str);
  }
}

export function shouldBeIngress(expose) {
  return expose.proto === "TCP" && expose.global && 80 === exposeExternalPort(expose);
}

function exposeExternalPort(expose) {
  if (expose.externalPort === 0) {
    return expose.port;
  }

  return expose.externalPort;
}

const defaultHTTPOptions = {
  MaxBodySize: 1048576,
  ReadTimeout: 60000,
  SendTimeout: 60000,
  NextTries: 3,
  NextTimeout: 0,
  NextCases: ["error", "timeout"]
};

// TODO Enum
const Endpoint_SHARED_HTTP = 0;
const Endpoint_RANDOM_PORT = 1;
const Endpoint_LEASED_IP = 2;

function getHttpOptions(options = {}) {
  return {
    MaxBodySize: options["max_body_size"] || defaultHTTPOptions.MaxBodySize,
    ReadTimeout: options["read_timeout"] || defaultHTTPOptions.ReadTimeout,
    SendTimeout: options["send_timeout"] || defaultHTTPOptions.SendTimeout,
    NextTries: options["next_tries"] || defaultHTTPOptions.NextTries,
    NextTimeout: options["next_timeout"] || defaultHTTPOptions.NextTimeout,
    NextCases: options["next_cases"] || defaultHTTPOptions.NextCases
  };
}

function resourceValue(value: number, asString: boolean): Uint8Array | string {
  const strVal = value.toString();
  const encoder = new TextEncoder();

  return asString
    ? strVal
    : encoder.encode(strVal);
}

// Port of: func (sdl *v2ComputeResources) toResourceUnits() types.ResourceUnits
export function toResourceUnits(computeResources, asString: boolean) {
  if (!computeResources) return {};

  let units = {} as any;
  if (computeResources.cpu) {
    const cpu =
      typeof computeResources.cpu.units === "string" && computeResources.cpu.units.endsWith("m")
        ? parseInt(computeResources.cpu.units.slice(0, -1))
        : (computeResources.cpu.units * 1000);

    units.cpu = {
      units: { val: resourceValue(cpu, asString) },
      attributes:
        computeResources.cpu.attributes &&
        Object.keys(computeResources.cpu.attributes)
          .sort()
          .map((key) => ({
            key: key,
            value: resourceValue(computeResources.cpu.attributes[key], asString)
          }))
    };
  }
  if (computeResources.memory) {
    units.memory = {
      quantity: { val: resourceValue(parseSizeStr(computeResources.memory.size), asString) },
      attributes:
        computeResources.memory.attributes &&
        Object.keys(computeResources.memory.attributes)
          .sort()
          .map((key) => ({
            key: key,
            value: resourceValue(computeResources.memory.attributes[key], asString)
          }))
    };
  }
  if (computeResources.storage) {
    const storages = computeResources.storage.map ? computeResources.storage : [computeResources.storage];
    units.storage =
      storages.map((storage) => ({
        name: storage.name || "default",
        quantity: { val: resourceValue(parseSizeStr(storage.size), asString) },
        attributes:
          storage.attributes &&
          Object.keys(storage.attributes)
            .sort()
            .map((key) => ({
              key: key,
              value: resourceValue(storage.attributes[key], true)
            }))
      })) || [];
  }

  units.endpoints = null;

  return units;
}

function computeEndpointSequenceNumbers(yamlJson) {
  let ipEndpointNames = {};

  Object.keys(yamlJson.services).forEach((svcName) => {
    const svc = yamlJson.services[svcName];

    svc?.expose?.forEach((expose) => {
      expose?.to
        ?.filter((to) => to.global && to.ip?.length > 0)
        .map((to) => to.ip)
        .sort()
        .forEach((ip, i) => {
          ipEndpointNames[ip] = i + 1;
        });
    });
  });

  return ipEndpointNames;
}

export function DeploymentGroups(yamlJson: any) {
  let groups = {} as any;
  const ipEndpointNames = computeEndpointSequenceNumbers(yamlJson);

  Object.keys(yamlJson.services).forEach((svcName) => {
    const svc = yamlJson.services[svcName];
    const depl = yamlJson.deployment[svcName];

    Object.keys(depl).forEach((placementName) => {
      const svcdepl = depl[placementName];
      const compute = yamlJson.profiles.compute[svcdepl.profile];
      const infra = yamlJson.profiles.placement[placementName];
      const price = infra.pricing[svcdepl.profile];

      // Account neededs to be a string
      price.amount = price.amount.toString();

      let group = groups[placementName];

      if (!group) {
        group = {
          name: placementName,
          requirements: {
            attributes: infra.attributes ? Object.keys(infra.attributes).map((key) => ({ key: key, value: infra.attributes[key] })) : [],
            signed_by: {
              all_of: infra.signedBy?.allOf || [],
              any_of: infra.signedBy?.anyOf || []
            }
          },
          resources: []
        };

        if (group.requirements.attributes) {
          group.requirements.attributes = group.requirements.attributes.sort((a, b) => a.key < b.key);
        }

        groups[group.name] = group;
      }

      const resources = {
        resources: toResourceUnits(compute.resources, false), // Chanded resources => unit
        price: price,
        count: svcdepl.count
      };

      let endpoints = [];
      svc?.expose?.forEach((expose) => {
        expose?.to
          ?.filter((to) => to.global)
          .forEach((to) => {
            const proto = ParseServiceProtocol(expose.proto);

            const v = {
              port: expose.port,
              externalPort: expose.as || 0,
              proto: proto,
              service: to.service || null,
              global: !!to.global,
              hosts: expose.accept || null,
              HTTPOptions: getHttpOptions(expose["http_options"])
            } as any;

            // Check to see if an IP endpoint is also specified
            if (to.ip?.length > 0) {
              const seqNo = ipEndpointNames[to.ip];
              v.EndpointSequenceNumber = seqNo || 0;
              endpoints.push({ kind: Endpoint_LEASED_IP, sequence_number: seqNo });
            }

            let kind = Endpoint_RANDOM_PORT;

            if (shouldBeIngress(v)) {
              kind = Endpoint_SHARED_HTTP;
            }

            endpoints.push({ kind: kind, sequence_number: 0 }); // TODO
          });
      });

      resources.resources.endpoints = endpoints;
      group.resources.push(resources);
    });
  });

  let names = Object.keys(groups);
  names = names.sort((a, b) => a < b ? 1 : 0);

  let result = names.map((name) => groups[name]);
  return result;
}

// Port of:    func (sdl *v2) Manifest() (manifest.Manifest, error
export function Manifest(yamlJson, asString = false) {
  let groups = {};

  const ipEndpointNames = computeEndpointSequenceNumbers(yamlJson);
  const sortedServicesNames = Object.keys(yamlJson.services).sort();

  sortedServicesNames.forEach((svcName) => {
    const svc = yamlJson.services[svcName];
    const depl = yamlJson.deployment[svcName];
    const sortedPlacementNames = Object.keys(depl).sort();

    sortedPlacementNames.forEach((placementName) => {
      const svcdepl = depl[placementName];
      let group = groups[placementName];

      if (!group) {
        group = {
          Name: placementName,
          Services: []
        };
        groups[placementName] = group;
      }

      const compute = yamlJson.profiles.compute[svcdepl.profile];
      const manifestResources = toResourceUnits(compute.resources, asString);
      let manifestExpose = [];

      svc.expose?.forEach((expose) => {
        const proto = ParseServiceProtocol(expose.proto);

        if (expose.to && expose.to.length > 0) {
          expose.to.forEach((to) => {
            let seqNo = null;

            if (to.global && to.ip?.length > 0) {
              const endpointExists = yamlJson.endpoints && yamlJson.endpoints[to.ip];

              if (!endpointExists) {
                throw new CustomValidationError(`Unknown endpoint "${to.ip}". Add to the list of endpoints in the "endpoints" section.`);
              }

              seqNo = ipEndpointNames[to.ip];
              manifestResources.endpoints = [{ kind: Endpoint_LEASED_IP, sequence_number: seqNo }];
            }

            const _expose = {
              Port: expose.port,
              ExternalPort: expose.as || 0,
              Proto: proto,
              Service: to.service || "",
              Global: !!to.global,
              Hosts: expose.accept || null,
              HTTPOptions: getHttpOptions(expose["http_options"]),
              IP: to.ip || "",
              EndpointSequenceNumber: seqNo || 0
            };

            manifestExpose = manifestExpose.concat([_expose]);
          });
        } else {
          const _expose = {
            Port: expose.port,
            ExternalPort: expose.as || 0,
            Proto: proto,
            Service: "",
            Global: false,
            Hosts: expose.accept?.items || null,
            HTTPOptions: getHttpOptions(expose["http_options"]),
            IP: "",
            EndpointSequenceNumber: 0
          } as any;

          manifestExpose = manifestExpose.concat([_expose]);
        }
      });

      const msvc = {
        Name: svcName,
        Image: svc.image,
        Command: svc.command || null,
        Args: svc.args || null,
        Env: svc.env || null,
        Resources: manifestResources,
        Count: svcdepl.count,
        Expose: manifestExpose
      } as any;

      if (svc.params) {
        msvc.params = {
          Storage: []
        };

        (Object.keys(svc.params?.storage) || []).forEach((name) => {
          msvc.params.Storage.push({
            name: name,
            mount: svc.params.storage[name].mount,
            readOnly: svc.params.storage[name].readOnly || false
          });
        });
      }

      // stable ordering for the Expose portion
      msvc.Expose =
        msvc.Expose &&
        msvc.Expose.sort((a, b) => {
          if (a.Service !== b.Service) {
            return a.Service < b.Service;
          }
          if (a.Port !== b.Port) {
            return a.Port < b.Port;
          }
          if (a.Proto !== b.Proto) {
            return a.Proto < b.Proto;
          }
          if (a.Global !== b.Global) {
            return a.Global < b.Global;
          }
          return false;
        });

      group.Services.push(msvc);
    });
  });

  let names = Object.keys(groups);
  names = names.sort((a, b) => a < b ? 1 : 0);

  let result = names.map((name) => groups[name]);
  return result;
}

export async function getManifestVersion(yamlJson) {
  const mani = Manifest(yamlJson, true);
  const version = await ManifestVersion(mani);

  return version;
}