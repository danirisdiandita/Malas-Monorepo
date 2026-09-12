package recipes

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
)

type Storage struct {
	Client *s3.Client
	Bucket string
}

func NewStorage(c config.S3Config) (*Storage, error) {
	if c.Endpoint == "" || c.Bucket == "" || c.AccessKey == "" || c.SecretKey == "" {
		return nil, fmt.Errorf("S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY are required")
	}
	endpoint := c.Endpoint
	if !strings.Contains(endpoint, "://") {
		scheme := "https"
		if !c.UseSSL {
			scheme = "http"
		}
		endpoint = scheme + "://" + endpoint
	}
	u, err := url.Parse(endpoint)
	if err != nil || u.Hostname() == "" || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || (u.Path != "" && u.Path != "/") {
		return nil, fmt.Errorf("invalid S3 endpoint")
	}
	if c.Port != "" && u.Port() == "" {
		u.Host += ":" + c.Port
	}
	region := c.Region
	if region == "" {
		region = "auto"
	}
	client := s3.New(s3.Options{
		Region: region, BaseEndpoint: aws.String(strings.TrimRight(u.String(), "/")), UsePathStyle: true,
		Credentials:                credentials.NewStaticCredentialsProvider(c.AccessKey, c.SecretKey, ""),
		HTTPClient:                 &http.Client{Timeout: 60 * time.Second},
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})
	return &Storage{Client: client, Bucket: c.Bucket}, nil
}

func (s *Storage) Upload(ctx context.Context, key string, body io.Reader, size int64, mime string) error {
	_, err := s.Client.PutObject(ctx, &s3.PutObjectInput{Bucket: &s.Bucket, Key: &key,
		Body: body, ContentLength: &size, ContentType: &mime})
	return err
}

func (s *Storage) ImageURL(ctx context.Context, key string) (string, error) {
	signed, err := s3.NewPresignClient(s.Client).PresignGetObject(ctx,
		&s3.GetObjectInput{Bucket: &s.Bucket, Key: &key},
		func(o *s3.PresignOptions) { o.Expires = 15 * time.Minute })
	if err != nil {
		return "", err
	}
	return signed.URL, nil
}
