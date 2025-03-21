//Function to convert S3 URL to CloudFrontUrl
const CLOUD_FRONT_DOMAIN = process.env.CLOUD_FRONT_DOMAIN;
const S3_DOMAIN =
  "youtubeclone-delicate-smoke-9951.s3.ap-northeast-2.amazonaws.com";

const convertS3UrlToCloudFrontUrl = (s3Url) => {
  if (!s3Url) return null;
  const filePath = s3Url.split(S3_DOMAIN)[1];
  return `${CLOUD_FRONT_DOMAIN}${filePath}`;
};

export default convertS3UrlToCloudFrontUrl;
