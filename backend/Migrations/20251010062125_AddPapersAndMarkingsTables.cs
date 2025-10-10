using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPapersAndMarkingsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Markings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Country = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ExamType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Stream = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SubjectId = table.Column<int>(type: "integer", nullable: true),
                    PaperType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PaperCategory = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Term = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SchoolId = table.Column<int>(type: "integer", nullable: true),
                    Uploader = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    FilePublicId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    FileFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UploadDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Markings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Markings_Schools_SchoolId",
                        column: x => x.SchoolId,
                        principalTable: "Schools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Markings_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaperDownloads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    UserEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResourceType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DownloadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Country = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaperDownloads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Papers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Country = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ExamType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Stream = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SubjectId = table.Column<int>(type: "integer", nullable: true),
                    PaperType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PaperCategory = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Term = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SchoolId = table.Column<int>(type: "integer", nullable: true),
                    Uploader = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    FilePublicId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    FileFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UploadDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Papers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Papers_Schools_SchoolId",
                        column: x => x.SchoolId,
                        principalTable: "Schools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Papers_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Markings_SchoolId",
                table: "Markings",
                column: "SchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_Markings_SubjectId",
                table: "Markings",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_PaperDownloads_DownloadedAt",
                table: "PaperDownloads",
                column: "DownloadedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PaperDownloads_ResourceId",
                table: "PaperDownloads",
                column: "ResourceId");

            migrationBuilder.CreateIndex(
                name: "IX_PaperDownloads_ResourceType",
                table: "PaperDownloads",
                column: "ResourceType");

            migrationBuilder.CreateIndex(
                name: "IX_PaperDownloads_UserId",
                table: "PaperDownloads",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Papers_SchoolId",
                table: "Papers",
                column: "SchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_Papers_SubjectId",
                table: "Papers",
                column: "SubjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Markings");

            migrationBuilder.DropTable(
                name: "PaperDownloads");

            migrationBuilder.DropTable(
                name: "Papers");
        }
    }
}
