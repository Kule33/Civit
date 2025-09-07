using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Country = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ExamType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Stream = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PaperType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PaperCategory = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Term = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SchoolName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Uploader = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    FilePublicId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UploadDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UniqueKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_UniqueKey",
                table: "Questions",
                column: "UniqueKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Questions");
        }
    }
}
